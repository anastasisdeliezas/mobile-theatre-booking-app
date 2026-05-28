import { pool } from '../config/db.js';

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  if (!rows[0].count) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function createTableIfMissing(tableName, createSql) {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );

  if (!rows[0].count) {
    await pool.query(createSql);
  }
}

async function createContactMessagesTableIfMissing() {
  await createTableIfMissing(
    'contact_messages',
    `
      CREATE TABLE contact_messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL,
        subject VARCHAR(200) NULL,
        message TEXT NOT NULL,
        status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  );
}

async function createPromoCodesTableIfMissing() {
  await createTableIfMissing(
    'promo_codes',
    `
      CREATE TABLE promo_codes (
        promo_id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(80) NOT NULL UNIQUE,
        title VARCHAR(160) NOT NULL,
        description TEXT NULL,
        discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
        discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  );
}

async function createRefreshTokensTableIfMissing() {
  await createTableIfMissing(
    'refresh_tokens',
    `
      CREATE TABLE refresh_tokens (
        refresh_token_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `
  );
}

async function createNewsletterSubscribersTableIfMissing() {
  await createTableIfMissing(
    'newsletter_subscribers',
    `
      CREATE TABLE newsletter_subscribers (
        subscriber_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL UNIQUE,
        source VARCHAR(40) NOT NULL DEFAULT 'mobile_app',
        status ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
        unsubscribed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `
  );
}

async function createShowReviewsTableIfMissing() {
  await createTableIfMissing(
    'show_reviews',
    `
      CREATE TABLE show_reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        show_id INT NOT NULL,
        user_id INT NULL,
        reviewer_name VARCHAR(160) NOT NULL,
        reviewer_email VARCHAR(190) NULL,
        rating TINYINT NOT NULL,
        title VARCHAR(160) NULL,
        comment TEXT NOT NULL,
        status ENUM('approved','hidden') NOT NULL DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_show_reviews_show FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE,
        CONSTRAINT fk_show_reviews_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
      )
    `
  );
}

export async function runMigrations() {
  await addColumnIfMissing('users', 'phone', 'VARCHAR(40) NULL');
  await addColumnIfMissing('users', 'avatar_url', 'VARCHAR(500) NULL');
  await addColumnIfMissing('users', 'bio', 'TEXT NULL');
  await addColumnIfMissing('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await addColumnIfMissing('theatres', 'avatar_url', 'VARCHAR(500) NULL');
  await addColumnIfMissing('theatres', 'intro_text', 'TEXT NULL');
  await addColumnIfMissing('theatres', 'space_overview', 'TEXT NULL');
  await addColumnIfMissing('theatres', 'booking_info', 'TEXT NULL');

  await addColumnIfMissing('shows', 'genre', 'VARCHAR(80) NULL');
  await addColumnIfMissing('shows', 'hero_image_url', 'VARCHAR(500) NULL');
  await addColumnIfMissing('shows', 'trailer_url', 'VARCHAR(1000) NULL');
  await addColumnIfMissing('shows', 'overview_text', 'TEXT NULL');
  await addColumnIfMissing('shows', 'cast_text', 'TEXT NULL');
  await addColumnIfMissing('shows', 'creatives_text', 'TEXT NULL');
  await addColumnIfMissing('shows', 'highlights_text', 'TEXT NULL');
  await addColumnIfMissing('shows', 'audience_text', 'TEXT NULL');
  await addColumnIfMissing('shows', 'content_warnings_text', 'TEXT NULL');

  await addColumnIfMissing('reservations', 'payment_method', 'VARCHAR(50) NULL');
  await addColumnIfMissing('reservations', 'card_last4', 'VARCHAR(4) NULL');
  await addColumnIfMissing('reservations', 'promo_id', 'INT NULL');
  await addColumnIfMissing('reservations', 'promo_code', 'VARCHAR(80) NULL');
  await addColumnIfMissing('reservations', 'discount_amount', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColumnIfMissing('reservations', 'final_price', 'DECIMAL(10,2) NULL');
  await addColumnIfMissing('reservations', 'ticket_token', 'VARCHAR(120) NULL');
  await addColumnIfMissing('reservations', 'checked_in_at', 'DATETIME NULL');

  await createContactMessagesTableIfMissing();
  await createPromoCodesTableIfMissing();
  await createRefreshTokensTableIfMissing();
  await createNewsletterSubscribersTableIfMissing();
  await createShowReviewsTableIfMissing();

  await pool.query("UPDATE seats SET category = 'Regular' WHERE category = 'Standard'");
}