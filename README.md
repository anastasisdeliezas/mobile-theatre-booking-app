# Del's Theatre – Theatre Booking App

Το **Del's Theatre** είναι ολοκληρωμένη εφαρμογή κρατήσεων για θέατρα και παραστάσεις. Περιλαμβάνει mobile/web εφαρμογή χρήστη, backend API, MySQL βάση δεδομένων και admin panel για διαχείριση περιεχομένου.

## 1. Τι περιλαμβάνει η εφαρμογή

Η εφαρμογή αποτελείται από τρία βασικά μέρη:

1. **Backend** (`backend`)
   - Node.js / Express API.
   - Σύνδεση με MySQL βάση.
   - Authentication με JWT.
   - Διαχείριση χρηστών, παραστάσεων, θεάτρων, κρατήσεων, μηνυμάτων, reviews και newsletter.
   - Αποστολή email επιβεβαίωσης/απόδειξης κράτησης μέσω SMTP.
   - Υποστήριξη ψηφιακού εισιτηρίου με QR code για κάθε ολοκληρωμένη κράτηση.
   - Upload εικόνων χρήστη/θεάτρων/παραστάσεων.
   - Validation και sanitization στις φόρμες.

2. **Mobile/Web App** (`mobile-app`)
   - Expo / React Native εφαρμογή.
   - Σελίδες αρχικής, παραστάσεων, θεάτρων, λεπτομερειών παράστασης, booking, checkout, payment, profile, contact και reviews.
   - Login/Register με ασφαλείς φόρμες.
   - Κράτηση θέσεων και ολοκλήρωση πληρωμής demo.
   - Ψηφιακό εισιτήριο με μοναδικό QR code μετά την ολοκλήρωση της κράτησης.
   - Αυτόματη αποστολή απόδειξης/επιβεβαίωσης κράτησης στο email του χρήστη, όταν έχουν ρυθμιστεί τα SMTP στοιχεία.
   - Προφίλ χρήστη με αλλαγή στοιχείων και εικόνας.

3. **Admin Panel** (`admin-panel`)
   - React / Vite περιβάλλον διαχείρισης.
   - Διαχείριση χρηστών, παραστάσεων, θεάτρων, showtimes, κρατήσεων, promos, μηνυμάτων και reviews.
   - Προστατευμένη είσοδος admin.

## 2. Βασικές λειτουργίες χρήστη

Ο χρήστης μπορεί να:

- δημιουργήσει λογαριασμό,
- συνδεθεί στην εφαρμογή,
- δει διαθέσιμες παραστάσεις,
- ανοίξει λεπτομέρειες παράστασης,
- επιλέξει διαθέσιμη ημερομηνία/ώρα,
- επιλέξει θέσεις,
- ολοκληρώσει demo checkout/payment,
- λάβει email επιβεβαίωσης/απόδειξης για την κράτηση,
- δει ψηφιακό εισιτήριο με QR code,
- δει τις κρατήσεις του,
- ακυρώσει κράτηση όπου επιτρέπεται,
- αλλάξει στοιχεία προφίλ,
- ανεβάσει εικόνα προφίλ,
- στείλει μήνυμα επικοινωνίας,
- αφήσει αξιολόγηση.

### 2.1 Ψηφιακά εισιτήρια, QR code και αποδείξεις email

Μετά την ολοκλήρωση μίας κράτησης, η εφαρμογή δημιουργεί ψηφιακό εισιτήριο για τον χρήστη. Το εισιτήριο περιλαμβάνει βασικά στοιχεία της κράτησης, όπως παράσταση, θέατρο, ημερομηνία/ώρα, αίθουσα, θέσεις και μοναδικό αναγνωριστικό κράτησης.

Κάθε εισιτήριο συνοδεύεται από **QR code**, το οποίο μπορεί να χρησιμοποιηθεί ως γρήγορη ψηφιακή ταυτοποίηση του εισιτηρίου κατά τον έλεγχο της κράτησης. Ο χρήστης μπορεί να δει το εισιτήριο μέσα από το ιστορικό/προφίλ του και να το παρουσιάσει κατά την είσοδο.

Επιπλέον, όταν τα στοιχεία SMTP είναι σωστά ρυθμισμένα στο backend, αποστέλλεται αυτόματα email επιβεβαίωσης/απόδειξης στον χρήστη. Το email λειτουργεί ως αποδεικτικό της κράτησης και περιλαμβάνει τα βασικά στοιχεία της αγοράς/κράτησης.

## 3. Βασικές λειτουργίες admin

Ο admin μπορεί να:

- συνδεθεί στο admin panel,
- δει dashboard/στατιστικά,
- διαχειριστεί παραστάσεις,
- διαχειριστεί θέατρα,
- διαχειριστεί showtimes,
- διαχειριστεί κρατήσεις,
- ελέγξει στοιχεία κράτησης που συνδέονται με το ψηφιακό εισιτήριο/QR,
- διαχειριστεί χρήστες,
- απαντήσει σε μηνύματα,
- ελέγξει reviews,
- διαχειριστεί promos/newsletter.

## 4. Τεχνολογίες

- **Frontend Mobile/Web:** React Native, Expo Router, Axios
- **Admin Panel:** React, Vite, Axios
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT tokens
- **Validation:** Zod στο backend και custom validation στο frontend
- **Uploads:** Multer
- **Email αποστολές:** SMTP configuration για αποδείξεις/επιβεβαιώσεις κράτησης
- **Digital ticketing:** QR code για ψηφιακή ταυτοποίηση εισιτηρίου

## 5. Προαπαιτούμενα

Πριν τρέξει το project σε νέο PC, πρέπει να υπάρχουν εγκατεστημένα:

- Node.js
- npm
- MySQL Server
- MySQL Workbench ή άλλο MySQL client
- Expo/Expo Go για mobile δοκιμή

Έλεγχος εγκατάστασης:

```bash
node -v
npm -v
```

## 6. Βάση δεδομένων

1. Άνοιξε MySQL Workbench.
2. Δημιούργησε βάση με όνομα:

```sql
CREATE DATABASE theatre_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Επίλεξε τη βάση:

```sql
USE theatre_booking;
```

4. Κάνε import ή εκτέλεσε το αρχείο:

```text
database.sql
```

Αν το `database.sql` περιέχει ήδη `CREATE DATABASE` και `USE`, τότε μπορείς απλά να το τρέξεις ολόκληρο.

## 7. Backend setup

Μπες στον φάκελο backend:

```bash
cd backend
npm install
```

Δημιούργησε ή έλεγξε το αρχείο:

```text
backend/.env
```

Παράδειγμα για local PC:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=το_mysql_password_σου
DB_NAME=theatre_booking
JWT_SECRET=change_me_super_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://localhost:19006

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Del's Theatre <no-reply@delstheatre.local>

REFRESH_TOKEN_DAYS=30
```

Για να αποστέλλονται κανονικά οι αποδείξεις/επιβεβαιώσεις με email, πρέπει να συμπληρωθούν τα πεδία `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` και `MAIL_FROM`. Αν τα SMTP στοιχεία μείνουν κενά, η εφαρμογή μπορεί να ολοκληρώνει την κράτηση, αλλά δεν θα μπορεί να στείλει πραγματικό email.

Τρέξιμο backend:

```bash
npm run dev
```

Αν όλα είναι σωστά, το API τρέχει στο:

```text
http://localhost:4000/api
```

## 8. Mobile app setup

Σε νέο terminal:

```bash
cd mobile-app
npm install
npm start
```

Για web δοκιμή:

```bash
npm run web
```

## 9. Mobile `.env` και IP αλλαγές

Το mobile app χρειάζεται να ξέρει πού βρίσκεται το backend API. Αυτό ορίζεται στο:

```text
mobile-app/.env
```

### Περίπτωση Α: Τρέχεις στο ίδιο PC μέσω web

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_PUBLIC_APP_URL=http://localhost:8081
```

### Περίπτωση Β: Τρέχεις από κινητό στο ίδιο Wi‑Fi

Βρες την IP του υπολογιστή που τρέχει το backend.

Σε Mac:

```bash
ipconfig getifaddr en0
```

Αν δεν βγάλει αποτέλεσμα, δοκίμασε:

```bash
ifconfig | grep "inet "
```

Σε Windows:

```bash
ipconfig
```

Ψάξε το `IPv4 Address`, π.χ.:

```text
192.168.1.50
```

Τότε στο `mobile-app/.env` βάζεις:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:4000/api
EXPO_PUBLIC_PUBLIC_APP_URL=http://192.168.1.50:8081
```

Σημαντικό: το κινητό και το PC πρέπει να είναι στο ίδιο Wi‑Fi.

### Περίπτωση Γ: Τρέχεις από hotspot

Αν κάνεις hotspot από κινητό και το PC συνδέεται σε αυτό, η IP αλλάζει. Βρες ξανά την IP του PC και άλλαξε μόνο τα δύο παρακάτω:

```env
EXPO_PUBLIC_API_URL=http://ΝΕΑ_IP:4000/api
EXPO_PUBLIC_PUBLIC_APP_URL=http://ΝΕΑ_IP:8081
```

Παράδειγμα:

```env
EXPO_PUBLIC_API_URL=http://172.20.10.2:4000/api
EXPO_PUBLIC_PUBLIC_APP_URL=http://172.20.10.2:8081
```

Μετά από αλλαγή `.env`, σταμάτα το Expo και ξανατρέξ' το:

```bash
npm start -- --clear
```

ή:

```bash
npx expo start -c
```

## 10. Admin panel setup

Σε νέο terminal:

```bash
cd admin-panel
npm install
npm run dev
```

Το admin panel ανοίγει συνήθως στο:

```text
http://localhost:5173
```

Το admin panel βρίσκει αυτόματα το backend:

- αν ανοίξει από `localhost`, χρησιμοποιεί `http://localhost:4000/api`,
- αν ανοίξει από άλλη IP, χρησιμοποιεί `http://Η_ΙΔΙΑ_IP:4000/api`.

## 11. CORS όταν μπαίνεις από άλλο PC ή κινητό

Αν ανοίγεις την εφαρμογή από άλλο PC/κινητό, πρόσθεσε την IP στο `backend/.env` στο `CORS_ORIGIN`.

Παράδειγμα:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://192.168.1.50:5173,http://192.168.1.50:8081
```

Μετά από αλλαγή στο backend `.env`, κάνε restart το backend:

```bash
npm run dev
```

## 12. Τι αλλάζουμε όταν το project πάει σε άλλο PC

Συνήθως αλλάζουμε μόνο αυτά:

1. Στο `backend/.env`:

```env
DB_USER=root
DB_PASSWORD=το_password_του_νέου_PC
DB_NAME=theatre_booking
CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://ΝΕΑ_IP:5173,http://ΝΕΑ_IP:8081
```

2. Στο `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://ΝΕΑ_IP:4000/api
EXPO_PUBLIC_PUBLIC_APP_URL=http://ΝΕΑ_IP:8081
```

3. Κάνουμε import ξανά το `database.sql` στη MySQL.

4. Τρέχουμε ξανά:

```bash
cd backend
npm install
npm run dev
```

```bash
cd mobile-app
npm install
npm start
```

```bash
cd admin-panel
npm install
npm run dev
```

## 13. Συνηθισμένα προβλήματα

### Το κινητό δεν συνδέεται στο backend

Έλεγξε:

- Είναι κινητό και PC στο ίδιο Wi‑Fi/hotspot;
- Είναι σωστή η IP στο `mobile-app/.env`;
- Τρέχει το backend στο port `4000`;
- Έγινε restart το Expo μετά την αλλαγή `.env`;
- Επιτρέπει το firewall εισερχόμενες συνδέσεις στο port `4000`;

### Βγάζει MySQL access denied

Έλεγξε το `backend/.env`:

```env
DB_USER=root
DB_PASSWORD=το_σωστό_password
```

### Βγάζει address already in use στο 4000

Κάτι άλλο τρέχει ήδη στο port 4000. Σταμάτα το προηγούμενο backend terminal ή άλλαξε port.

### Ανεβάζω εικόνα προφίλ και δεν φαίνεται παντού

Η διορθωμένη έκδοση αποθηκεύει την εικόνα αμέσως και στο backend profile. Αν αλλάξεις χειροκίνητα αρχεία, βεβαιώσου ότι το endpoint `/auth/upload` επιστρέφει URL και μετά γίνεται update στο `/auth/profile`.

### Δεν αποστέλλεται email απόδειξης/επιβεβαίωσης

Έλεγξε:

- Είναι συμπληρωμένα σωστά τα SMTP στοιχεία στο `backend/.env`;
- Τρέχει το backend και έγινε restart μετά την αλλαγή του `.env`;
- Το email του χρήστη είναι έγκυρο;
- Ο SMTP provider επιτρέπει αποστολή από local περιβάλλον;
- Δεν μπλοκάρεται η σύνδεση από firewall ή λάθος port/secure setting;

### Δεν εμφανίζεται το QR στο εισιτήριο

Έλεγξε:

- Η κράτηση έχει ολοκληρωθεί επιτυχώς;
- Το ticket/booking έχει μοναδικό αναγνωριστικό;
- Το mobile app παίρνει σωστά τα στοιχεία κράτησης από το backend;
- Έγινε restart του Expo μετά από αλλαγές στον κώδικα ή στο `.env`;

## 14. Προτεινόμενη σειρά εκκίνησης για παρουσίαση

1. Άνοιξε MySQL και βεβαιώσου ότι υπάρχει η βάση `theatre_booking`.
2. Τρέξε backend:

```bash
cd backend
npm run dev
```

3. Τρέξε mobile/web app:

```bash
cd mobile-app
npm start
```

4. Τρέξε admin panel:

```bash
cd admin-panel
npm run dev
```

5. Κάνε γρήγορη δοκιμή:

- Register/Login χρήστη
- Προβολή παράστασης
- Κράτηση θέσεων
- Checkout/payment demo
- Έλεγχος ψηφιακού εισιτηρίου με QR code
- Έλεγχος email απόδειξης/επιβεβαίωσης κράτησης
- Προφίλ χρήστη
- Admin login
- Έλεγχος κράτησης από admin

## 15. Περιγραφή για εργασία

Η εφαρμογή υλοποιεί ένα πλήρες σύστημα θεατρικών κρατήσεων, στο οποίο οι χρήστες μπορούν να αναζητούν παραστάσεις, να βλέπουν λεπτομέρειες, να επιλέγουν διαθέσιμες ώρες και θέσεις και να ολοκληρώνουν μία κράτηση μέσω demo διαδικασίας πληρωμής. Μετά την ολοκλήρωση της κράτησης δημιουργείται ψηφιακό εισιτήριο με QR code και, όταν έχουν ρυθμιστεί τα SMTP στοιχεία, αποστέλλεται email επιβεβαίωσης/απόδειξης στον χρήστη. Παράλληλα, ο διαχειριστής έχει πρόσβαση σε ξεχωριστό admin panel για τη διαχείριση του περιεχομένου και των κρατήσεων. Η εφαρμογή χρησιμοποιεί backend API, MySQL βάση δεδομένων, μηχανισμό authentication και ασφαλείς φόρμες με validation τόσο στο frontend όσο και στο backend.

## 16. Ανέβασμα στο GitHub

Για να ανέβει σωστά η εργασία στο GitHub:

1. Δεν ανεβάζουμε πραγματικά `.env` αρχεία, κωδικούς βάσης, SMTP κωδικούς ή app passwords. Χρησιμοποιούμε μόνο `.env.example`.
2. Δεν ανεβάζουμε `node_modules`, `.expo`, `dist`, `.DS_Store` ή προσωρινά αρχεία.
3. Ανεβάζουμε τον κώδικα, το `database.sql`, το README, τα `package.json` / `package-lock.json` και τα απαραίτητα assets/uploads που χρειάζεται το demo.
4. Σε νέο υπολογιστή, ο χρήστης αντιγράφει τα `.env.example` σε `.env`, συμπληρώνει τα δικά του στοιχεία και εκτελεί `npm install` σε `backend`, `mobile-app` και `admin-panel`.

Βασικές εντολές για νέο repository:

```bash
git init
git add .
git commit -m "Initial submission - Del's Theatre booking app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

Αν υπάρχει ήδη repository, χρησιμοποιούμε μόνο:

```bash
git add .
git commit -m "Final project submission"
git push
```


## 16. Demo λογαριασμοί

Για γρήγορη δοκιμή της εφαρμογής μπορούν να χρησιμοποιηθούν οι παρακάτω demo λογαριασμοί.

### Demo χρήστης mobile/web app

```text
Email: periergos122@gmail.com
Password: 123456

```

Με τον demo χρήστη μπορεί να γίνει σύνδεση στην εφαρμογή, προβολή παραστάσεων, επιλογή θέσεων, δημιουργία κράτησης, προβολή ιστορικού κρατήσεων, εμφάνιση QR εισιτηρίου και χρήση των βασικών λειτουργιών προφίλ.

### Demo διαχειριστής admin panel

```text
Email: admin@theatreapp.com
Password: Admin123!
```

Ο demo admin χρησιμοποιείται για είσοδο στο admin panel, όπου υπάρχει δυνατότητα διαχείρισης θεάτρων, παραστάσεων, showtimes, κρατήσεων, χρηστών, reviews, promos/newsletter και μηνυμάτων επικοινωνίας.

> Σημείωση: Οι παραπάνω λογαριασμοί είναι αποκλειστικά demo στοιχεία για παρουσίαση και αξιολόγηση της εργασίας.
