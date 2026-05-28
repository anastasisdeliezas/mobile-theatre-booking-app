import { pool } from '../config/db.js';
import fs from 'fs';
import { sendMail } from './mailService.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function getReservationReceiptData(reservationId, userId = null) {
  const [rows] = await pool.query(
    `SELECT r.reservation_id, r.user_id, r.booking_code, r.ticket_token, r.status, r.created_at,
            r.payment_method, r.card_last4,
            r.promo_code, r.discount_amount, r.final_price,
            u.name, u.email,
            st.start_time, st.hall_name, st.base_price,
            sh.title, th.name AS theatre_name, th.location,
            GROUP_CONCAT(CONCAT(se.row_label, se.seat_number) ORDER BY se.row_label, se.seat_number SEPARATOR ', ') AS seats,
            SUM(
              CASE
                WHEN se.category = 'VIP' THEN 28
                WHEN se.category = 'Economy' THEN 16
                WHEN se.category = 'Regular' THEN 22
                ELSE st.base_price
              END
            ) AS calculated_base_total
     FROM reservations r
     JOIN users u ON u.user_id = r.user_id
     JOIN showtimes st ON st.showtime_id = r.showtime_id
     JOIN shows sh ON sh.show_id = st.show_id
     JOIN theatres th ON th.theatre_id = sh.theatre_id
     LEFT JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
     LEFT JOIN seats se ON se.seat_id = rs.seat_id
     WHERE r.reservation_id = ? ${userId ? 'AND r.user_id = ?' : ''}
     GROUP BY r.reservation_id`,
    userId ? [reservationId, userId] : [reservationId]
  );

  return rows[0];
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function mapStatusLabel(status) {
  if (status === 'confirmed') return 'Επιβεβαιωμένη';
  if (status === 'cancelled') return 'Ακυρωμένη';
  if (status === 'pending') return 'Σε αναμονή';
  return status || '—';
}

function mapPaymentMethodLabel(paymentMethod) {
  if (paymentMethod === 'card_demo') return 'Κάρτα';
  if (paymentMethod === 'counter') return 'Πληρωμή στο ταμείο';
  return paymentMethod || '—';
}

function maskCard(last4) {
  if (!last4) return '—';
  return `**** **** **** ${last4}`;
}

function money(value) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function getPublicAppUrl() {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.EXPO_PUBLIC_PUBLIC_APP_URL ||
    process.env.EXPO_PUBLIC_WEB_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:8081'
  ).replace(/\/$/, '');
}

function buildTicketVerifyUrl(data) {
  const token = encodeURIComponent(data.ticket_token || data.booking_code || '');
  return `${getPublicAppUrl()}/ticket/verify?token=${token}`;
}

async function generateTicketQrBuffer(data) {
  const ticketUrl = buildTicketVerifyUrl(data);

  const dataUrl = await QRCode.toDataURL(ticketUrl, {
    margin: 1,
    width: 360,
    color: {
      dark: '#111827',
      light: '#FFFFFF'
    }
  });

  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function findExistingPath(paths) {
  return paths.find((item) => item && fs.existsSync(item));
}

function resolvePdfFonts(doc) {
  const regularPath = findExistingPath([
    process.env.PDF_FONT_PATH,
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
  ]);

  const boldPath = findExistingPath([
    process.env.PDF_BOLD_FONT_PATH,
    '/Library/Fonts/Arial Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    regularPath
  ]);

  if (regularPath) doc.registerFont('AppRegular', regularPath);
  if (boldPath) doc.registerFont('AppBold', boldPath);

  return {
    regular: regularPath ? 'AppRegular' : 'Helvetica',
    bold: boldPath ? 'AppBold' : regularPath ? 'AppRegular' : 'Helvetica'
  };
}

const PDF_THEME = {
  bg: '#F6F2EB',
  card: '#FFFFFF',
  cardSoft: '#FCFAF6',
  ink: '#1F232B',
  muted: '#6F727C',
  line: '#EADFCE',
  lineStrong: '#DECAB0',
  dark: '#111827',
  dark2: '#1F2937',
  gold: '#D9731A',
  goldDark: '#B95F12',
  goldSoft: '#FFF3E4',
  success: '#2B8F50',
  successSoft: '#EAF7EF',
  danger: '#CF4A3D',
  dangerSoft: '#FFF0ED',
  info: '#3D73CF',
  infoSoft: '#EDF3FF'
};

function statusTone(status) {
  if (status === 'confirmed') {
    return { bg: PDF_THEME.successSoft, color: PDF_THEME.success, label: mapStatusLabel(status) };
  }
  if (status === 'cancelled') {
    return { bg: PDF_THEME.dangerSoft, color: PDF_THEME.danger, label: mapStatusLabel(status) };
  }
  return { bg: PDF_THEME.infoSoft, color: PDF_THEME.info, label: mapStatusLabel(status) };
}

function addPageBase(doc, fonts, qrBuffer = null) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PDF_THEME.bg);

  doc
    .rect(0, 0, doc.page.width, 170)
    .fill(PDF_THEME.dark);

  doc
    .circle(512, 28, 86)
    .fill('#263449');

  doc
    .circle(72, 150, 78)
    .fill('#1A2434');

  if (qrBuffer) {
    const qrX = 456;
    const qrY = 18;
    const qrSize = 92;

    doc
      .roundedRect(qrX, qrY, qrSize, qrSize, 20)
      .fill('#FFFFFF');

    doc.image(qrBuffer, qrX + 10, qrY + 10, {
      width: qrSize - 20,
      height: qrSize - 20
    });
  }

  doc.fillColor('#FFFFFF').font(fonts.bold).fontSize(18).text("Del's Theatre", 42, 32);
  doc.fillColor('#C9D1DD').font(fonts.regular).fontSize(9).text('Θέατρα & παραστάσεις', 42, 55);

  doc
    .roundedRect(42, 76, 140, 28, 14)
    .fill(PDF_THEME.goldSoft);

  doc
    .fillColor(PDF_THEME.goldDark)
    .font(fonts.bold)
    .fontSize(9)
    .text('ΑΠΟΔΕΙΞΗ ΚΡΑΤΗΣΗΣ', 56, 85);
}

function drawFooter(doc, fonts) {
  const y = doc.page.height - 48;

  doc
    .strokeColor('#E7D9C5')
    .lineWidth(1)
    .moveTo(42, y - 12)
    .lineTo(doc.page.width - 42, y - 12)
    .stroke();

  doc.fillColor(PDF_THEME.muted).font(fonts.regular).fontSize(8.5);
  doc.text("Del's Theatre", 42, y, { width: 160 });
  doc.text('Η παρούσα απόδειξη δημιουργήθηκε αυτόματα από το σύστημα κρατήσεων.', 150, y, {
    width: doc.page.width - 192,
    align: 'right'
  });
}

function pill(doc, fonts, text, x, y, options = {}) {
  const bg = options.bg || PDF_THEME.goldSoft;
  const color = options.color || PDF_THEME.goldDark;
  const padX = options.padX || 12;
  const height = options.height || 26;
  const width = options.width || Math.max(74, doc.widthOfString(text) + padX * 2);

  doc.roundedRect(x, y, width, height, height / 2).fill(bg);

  doc
    .fillColor(color)
    .font(fonts.bold)
    .fontSize(options.fontSize || 9)
    .text(text, x + padX, y + 8, {
      width: width - padX * 2,
      lineBreak: false
    });

  return width;
}

function card(doc, x, y, w, h, options = {}) {
  doc
    .lineWidth(1)
    .roundedRect(x, y, w, h, options.radius || 22)
    .fillAndStroke(options.fill || PDF_THEME.card, options.stroke || PDF_THEME.line);
}

function labelValue(doc, fonts, label, value, x, y, options = {}) {
  const labelWidth = options.labelWidth || 135;
  const width = options.width || 246;
  const valueWidth = width - labelWidth;

  doc.fillColor(PDF_THEME.muted).font(fonts.regular).fontSize(options.labelSize || 9.5);
  const labelHeight = doc.heightOfString(label, { width: labelWidth });
  doc.text(label, x, y, { width: labelWidth });

  doc
    .fillColor(options.valueColor || PDF_THEME.ink)
    .font(options.bold ? fonts.bold : fonts.regular)
    .fontSize(options.valueSize || 10.5);

  const valueHeight = doc.heightOfString(String(value || '—'), { width: valueWidth });
  doc.text(String(value || '—'), x + labelWidth, y, { width: valueWidth });

  return Math.max(labelHeight, valueHeight) + (options.gap || 11);
}

function sectionHeading(doc, fonts, title, x, y, width) {
  doc
    .fillColor(PDF_THEME.goldDark)
    .font(fonts.bold)
    .fontSize(8.5)
    .text("DEL'S THEATRE", x, y, {
      width,
      characterSpacing: 0.8
    });

  doc
    .fillColor(PDF_THEME.ink)
    .font(fonts.bold)
    .fontSize(15)
    .text(title, x, y + 14, { width });
}

export async function generateReservationReceiptPdf(reservationId, userId = null) {
  const data = await getReservationReceiptData(reservationId, userId);

  if (!data) {
    const error = new Error('Η κράτηση δεν βρέθηκε');
    error.status = 404;
    throw error;
  }

  const qrBuffer = await generateTicketQrBuffer(data);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true
  });

  const fonts = resolvePdfFonts(doc);
  const chunks = [];

  return await new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve({
        filename: `receipt-${data.booking_code}.pdf`,
        buffer: Buffer.concat(chunks),
        data
      });
    });
    doc.on('error', reject);

    const pageW = doc.page.width;
    const left = 42;
    const right = pageW - 42;
    const contentW = right - left;

    const finalPrice =
      data.final_price != null
        ? Number(data.final_price)
        : Number(data.calculated_base_total || 0);

    const baseTotal = Number(data.calculated_base_total || 0);
    const discount = Number(data.discount_amount || 0);
    const status = statusTone(data.status);
    const when = formatDateTime(data.start_time);

    addPageBase(doc, fonts, qrBuffer);

    doc
      .fillColor('#FFFFFF')
      .font(fonts.bold)
      .fontSize(28)
      .text('Απόδειξη κράτησης', left, 112, {
        width: 330,
        lineGap: 2
      });

    doc
      .fillColor('#C9D1DD')
      .font(fonts.regular)
      .fontSize(10.5)
      .text('Επίσημη επιβεβαίωση κράτησης και πληρωμής.', left, 146, {
        width: 330
      });

    pill(doc, fonts, status.label, right - 148, 112, {
      width: 148,
      bg: status.bg,
      color: status.color
    });

    const heroY = 196;
    card(doc, left, heroY, contentW, 118, { radius: 24, fill: PDF_THEME.card });

    doc
      .fillColor(PDF_THEME.goldDark)
      .font(fonts.bold)
      .fontSize(8.5)
      .text('ΠΑΡΑΣΤΑΣΗ', left + 22, heroY + 22, {
        width: 150,
        characterSpacing: 0.6
      });

    doc
      .fillColor(PDF_THEME.ink)
      .font(fonts.bold)
      .fontSize(22)
      .text(data.title || 'Παράσταση', left + 22, heroY + 40, {
        width: 305,
        lineGap: 2
      });

    doc
      .fillColor(PDF_THEME.muted)
      .font(fonts.regular)
      .fontSize(11)
      .text(`${data.theatre_name || 'Θέατρο'} · ${data.location || 'Τοποθεσία'}`, left + 22, heroY + 94, {
        width: 305,
        lineBreak: false
      });

    doc.roundedRect(right - 170, heroY + 22, 148, 74, 18).fill(PDF_THEME.goldSoft);

    doc
      .fillColor(PDF_THEME.goldDark)
      .font(fonts.bold)
      .fontSize(8.5)
      .text('ΚΩΔΙΚΟΣ ΚΡΑΤΗΣΗΣ', right - 154, heroY + 38, {
        width: 116,
        characterSpacing: 0.4
      });

    doc
      .fillColor(PDF_THEME.ink)
      .font(fonts.bold)
      .fontSize(15)
      .text(data.booking_code || '—', right - 154, heroY + 58, {
        width: 116
      });

    const detailsY = 340;
    const leftW = 316;
    const rightW = contentW - leftW - 16;

    card(doc, left, detailsY, leftW, 270, { radius: 22, fill: PDF_THEME.card });
    sectionHeading(doc, fonts, 'Στοιχεία κράτησης', left + 20, detailsY + 20, leftW - 40);

    let y = detailsY + 66;
    y += labelValue(doc, fonts, 'Ονοματεπώνυμο', data.name || '—', left + 20, y, {
      width: leftW - 40,
      labelWidth: 124,
      bold: true
    });
    y += labelValue(doc, fonts, 'Email', data.email || '—', left + 20, y, {
      width: leftW - 40,
      labelWidth: 124
    });
    y += labelValue(doc, fonts, 'Ημερομηνία & ώρα', when, left + 20, y, {
      width: leftW - 40,
      labelWidth: 124,
      bold: true
    });
    y += labelValue(doc, fonts, 'Αίθουσα', data.hall_name || '—', left + 20, y, {
      width: leftW - 40,
      labelWidth: 124
    });
    y += labelValue(doc, fonts, 'Θέσεις', data.seats || '—', left + 20, y, {
      width: leftW - 40,
      labelWidth: 124,
      bold: true
    });
    y += labelValue(doc, fonts, 'Δημιουργία', formatDateTime(data.created_at), left + 20, y, {
      width: leftW - 40,
      labelWidth: 124
    });

    card(doc, left + leftW + 16, detailsY, rightW, 270, { radius: 22, fill: PDF_THEME.card });
    sectionHeading(doc, fonts, 'Πληρωμή', left + leftW + 36, detailsY + 20, rightW - 40);

    let py = detailsY + 66;
    py += labelValue(doc, fonts, 'Τρόπος', mapPaymentMethodLabel(data.payment_method), left + leftW + 36, py, {
      width: rightW - 40,
      labelWidth: 76,
      bold: true
    });
    py += labelValue(doc, fonts, 'Κάρτα', maskCard(data.card_last4), left + leftW + 36, py, {
      width: rightW - 40,
      labelWidth: 76
    });
    py += labelValue(doc, fonts, 'Promo', data.promo_code || 'Χωρίς promo', left + leftW + 36, py, {
      width: rightW - 40,
      labelWidth: 76
    });

    doc.roundedRect(left + leftW + 36, detailsY + 168, rightW - 40, 78, 18).fill(PDF_THEME.goldSoft);

    doc
      .fillColor(PDF_THEME.muted)
      .font(fonts.bold)
      .fontSize(9)
      .text('ΤΕΛΙΚΗ ΤΙΜΗ', left + leftW + 52, detailsY + 186, {
        width: rightW - 72,
        characterSpacing: 0.5
      });

    doc
      .fillColor(PDF_THEME.goldDark)
      .font(fonts.bold)
      .fontSize(26)
      .text(money(finalPrice), left + leftW + 52, detailsY + 204, {
        width: rightW - 72
      });

    const pricingY = 632;
    card(doc, left, pricingY, contentW, 76, { radius: 22, fill: PDF_THEME.cardSoft });

    const columnW = contentW / 3;
    const priceItems = [
      ['Τιμή βάσης', money(baseTotal), PDF_THEME.ink],
      ['Έκπτωση', money(discount), discount > 0 ? PDF_THEME.success : PDF_THEME.ink],
      ['Τελικό σύνολο', money(finalPrice), PDF_THEME.goldDark]
    ];

    priceItems.forEach(([label, value, color], index) => {
      const x = left + index * columnW + 18;

      doc
        .fillColor(PDF_THEME.muted)
        .font(fonts.bold)
        .fontSize(8.5)
        .text(label, x, pricingY + 20, {
          width: columnW - 36,
          characterSpacing: 0.4
        });

      doc
        .fillColor(color)
        .font(fonts.bold)
        .fontSize(index === 2 ? 18 : 16)
        .text(value, x, pricingY + 39, {
          width: columnW - 36
        });
    });

    const noticeY = 730;
    card(doc, left, noticeY, contentW, 62, { radius: 18, fill: '#FFFFFF' });

    doc
      .fillColor(PDF_THEME.ink)
      .font(fonts.bold)
      .fontSize(11)
      .text('Χρήσιμη πληροφορία', left + 18, noticeY + 15, {
        width: contentW - 36
      });

    doc
      .fillColor(PDF_THEME.muted)
      .font(fonts.regular)
      .fontSize(9.7)
      .text(
        'Παρακαλούμε να έχετε διαθέσιμο τον κωδικό κράτησης ή το QR εισιτήριό σας κατά την άφιξή σας. Η παρούσα απόδειξη επιβεβαιώνει την καταχώρηση της κράτησης στο σύστημα.',
        left + 18,
        noticeY + 32,
        { width: contentW - 36, lineGap: 2 }
      );

    drawFooter(doc, fonts);
    doc.end();
  });
}

function receiptTemplate(data) {
  const when = formatDateTime(data.start_time);
  const finalPrice = data.final_price != null ? money(data.final_price) : money(data.calculated_base_total);
  const status = statusTone(data.status);

  const safe = {
    title: escapeHtml(data.title),
    theatre: escapeHtml(data.theatre_name),
    location: escapeHtml(data.location),
    name: escapeHtml(data.name || '—'),
    email: escapeHtml(data.email || '—'),
    booking: escapeHtml(data.booking_code || '—'),
    when: escapeHtml(when),
    hall: escapeHtml(data.hall_name || '—'),
    seats: escapeHtml(data.seats || '—'),
    status: escapeHtml(mapStatusLabel(data.status)),
    payment: escapeHtml(mapPaymentMethodLabel(data.payment_method)),
    card: escapeHtml(maskCard(data.card_last4)),
    promo: escapeHtml(data.promo_code || 'Χωρίς promo'),
    discount: escapeHtml(money(data.discount_amount)),
    base: escapeHtml(money(data.calculated_base_total)),
    final: escapeHtml(finalPrice)
  };

  const row = (label, value, strong = false) => `
    <tr>
      <td style="padding:11px 0;color:#8B95A7;border-bottom:1px solid rgba(255,255,255,.07)">${label}</td>
      <td style="padding:11px 0;text-align:right;color:${strong ? '#E8C06A' : '#F8FAFC'};font-weight:${strong ? '800' : '650'};border-bottom:1px solid rgba(255,255,255,.07)">${value}</td>
    </tr>`;

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0b1320;padding:32px;color:#f8fafc">
    <div style="max-width:720px;margin:0 auto;background:#101a2d;border:1px solid rgba(255,255,255,.08);border-radius:28px;overflow:hidden">
      <div style="padding:30px;background:linear-gradient(135deg,#111827,#1f2937)">
        <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(232,192,106,.14);color:#e8c06a;font-weight:800;letter-spacing:.04em">ΑΠΟΔΕΙΞΗ ΚΡΑΤΗΣΗΣ</div>
        <h1 style="margin:18px 0 8px;font-size:30px;line-height:1.15">Η κράτησή σας επιβεβαιώθηκε</h1>
        <p style="margin:0;color:#aab4c4;line-height:1.6">Σας ευχαριστούμε που κλείσατε εισιτήρια μέσω Del's Theatre.</p>
      </div>

      <div style="padding:28px">
        <div style="padding:22px;border-radius:22px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:20px">
          <div style="display:flex;gap:16px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
            <div>
              <div style="color:#E8C06A;font-weight:800;font-size:12px;letter-spacing:.08em">ΠΑΡΑΣΤΑΣΗ</div>
              <h2 style="margin:8px 0 6px;font-size:25px;line-height:1.2">${safe.title}</h2>
              <p style="margin:0;color:#aab4c4">${safe.theatre} · ${safe.location}</p>
            </div>
            <div style="padding:10px 14px;border-radius:999px;background:${status.bg};color:${status.color};font-weight:800">${safe.status}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse">
          ${row('Ονοματεπώνυμο', safe.name)}
          ${row('Email', safe.email)}
          ${row('Κωδικός κράτησης', safe.booking, true)}
          ${row('Ημερομηνία & ώρα', safe.when)}
          ${row('Αίθουσα', safe.hall)}
          ${row('Θέσεις', safe.seats, true)}
          ${row('Πληρωμή', safe.payment)}
          ${row('Κάρτα', safe.card)}
          ${row('Promo code', safe.promo)}
          ${row('Έκπτωση', safe.discount)}
          ${row('Τιμή βάσης', safe.base)}
          ${row('Τελική τιμή', safe.final, true)}
        </table>

        <div style="margin-top:22px;padding:18px;border-radius:18px;background:rgba(232,192,106,.10);border:1px solid rgba(232,192,106,.18);color:#d8deea;line-height:1.65">
          Παρακαλούμε να έχετε διαθέσιμο τον κωδικό κράτησης ή το εισιτήριό σας από την εφαρμογή κατά την άφιξή σας.
          Αν χρειαστεί να ελέγξετε ή να ακυρώσετε την κράτησή σας, επισκεφθείτε τον λογαριασμό σας.
        </div>
      </div>
    </div>
  </div>`;

  const text =
    `Η κράτησή σας επιβεβαιώθηκε\n\n` +
    `Παράσταση: ${data.title}\n` +
    `Θέατρο: ${data.theatre_name} - ${data.location}\n` +
    `Ονοματεπώνυμο: ${data.name || '—'}\n` +
    `Email: ${data.email || '—'}\n` +
    `Κωδικός κράτησης: ${data.booking_code}\n` +
    `Ημερομηνία: ${when}\n` +
    `Αίθουσα: ${data.hall_name}\n` +
    `Θέσεις: ${data.seats || '—'}\n` +
    `Κατάσταση: ${mapStatusLabel(data.status)}\n` +
    `Πληρωμή: ${mapPaymentMethodLabel(data.payment_method)}\n` +
    `Κάρτα: ${maskCard(data.card_last4)}\n` +
    `Promo code: ${data.promo_code || 'Χωρίς promo'}\n` +
    `Έκπτωση: ${money(data.discount_amount)}\n` +
    `Τιμή βάσης: ${money(data.calculated_base_total)}\n` +
    `Τελική τιμή: ${finalPrice}`;

  return { html, text };
}

export async function sendReservationReceipt(reservationId, userId = null) {
  const data = await getReservationReceiptData(reservationId, userId);

  if (!data) {
    const error = new Error('Η κράτηση δεν βρέθηκε');
    error.status = 404;
    throw error;
  }

  const tpl = receiptTemplate(data);
  const pdf = await generateReservationReceiptPdf(reservationId, userId);

  const result = await sendMail({
    to: data.email,
    subject: `Απόδειξη κράτησης · ${data.title}`,
    html: tpl.html,
    text: tpl.text,
    attachments: [
      {
        filename: pdf.filename,
        content: pdf.buffer,
        contentType: 'application/pdf'
      }
    ]
  });

  return {
    success: true,
    message: result.sent
      ? 'Το email της απόδειξης στάλθηκε επιτυχώς με συνημμένο PDF.'
      : 'Η αποστολή email παραλείφθηκε επειδή δεν έχει ρυθμιστεί SMTP.',
    mail: result
  };
}