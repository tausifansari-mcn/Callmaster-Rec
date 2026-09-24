-- =====================================================================
--  CallMaster website — MySQL schema for database `db_masmin`
--
--  The API applies this file automatically on start-up (DB_AUTO_MIGRATE=true),
--  so you normally don't need to run it by hand. It is safe to re-run:
--  every statement is CREATE TABLE IF NOT EXISTS.
--
--  Manual run (optional):   mysql -u <user> -p db_masmin < backend/database/schema.sql
--  Compatible with MySQL 5.7+ / 8.x and MariaDB 10.3+.
-- =====================================================================

-- Admin panel users -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(120)  NOT NULL,
  email          VARCHAR(190)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  role           ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
  active         TINYINT(1)    NOT NULL DEFAULT 1,
  last_login_at  DATETIME(3)   NULL,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing-request leads (Deep Customer Insights form) --------------------
CREATE TABLE IF NOT EXISTS leads (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source          VARCHAR(60)   NOT NULL DEFAULT 'insights-pricing',
  name            VARCHAR(160)  NOT NULL,
  organization    VARCHAR(190)  NOT NULL,
  email           VARCHAR(190)  NOT NULL,
  phone           VARCHAR(30)   NOT NULL,
  call_type       VARCHAR(80)   NULL,
  monthly_volume  VARCHAR(80)   NULL,
  qa_setup        VARCHAR(120)  NULL,
  status          ENUM('new','contacted','qualified','closed') NOT NULL DEFAULT 'new',
  notes           TEXT          NULL,
  ip              VARCHAR(64)   NULL,
  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_leads_status (status),
  KEY idx_leads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact-page messages --------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(160)  NOT NULL,
  organization  VARCHAR(190)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  phone         VARCHAR(30)   NOT NULL DEFAULT '',
  interest      VARCHAR(80)   NOT NULL DEFAULT '',
  message       TEXT          NULL,
  status        ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
  notes         TEXT          NULL,
  ip            VARCHAR(64)   NULL,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_contacts_status (status),
  KEY idx_contacts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders (self-serve checkout) ------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id             VARCHAR(30)   NOT NULL,              -- public reference, e.g. CM-CL-6116C5
  access_token         VARCHAR(64)   NOT NULL,              -- lets the buyer's browser finish payment
  product_key          VARCHAR(40)   NOT NULL,
  product              VARCHAR(80)   NOT NULL,
  plan                 VARCHAR(160)  NOT NULL,
  mode                 ENUM('plan','cart') NOT NULL,
  unit                 VARCHAR(30)   NULL,
  billing_note         VARCHAR(400)  NULL,
  qty_label            VARCHAR(40)   NULL,
  qty                  INT           NOT NULL DEFAULT 1,
  unit_price           DECIMAL(12,2) NULL,
  config               TEXT          NULL,                  -- JSON: what was configured on the product page
  subtotal             DECIMAL(12,2) NOT NULL,
  discount_code        VARCHAR(40)   NULL,
  discount_pct         DECIMAL(5,2)  NOT NULL DEFAULT 0,
  discount_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_rate             DECIMAL(5,2)  NOT NULL DEFAULT 18,
  gst                  DECIMAL(12,2) NOT NULL DEFAULT 0,
  total                DECIMAL(12,2) NOT NULL,
  currency             CHAR(3)       NOT NULL DEFAULT 'INR',
  customer_company     VARCHAR(190)  NOT NULL,
  customer_contact     VARCHAR(160)  NOT NULL,
  customer_gst_number  VARCHAR(20)   NOT NULL,
  customer_phone       VARCHAR(30)   NOT NULL,
  customer_email       VARCHAR(190)  NOT NULL,
  sow_original_name    VARCHAR(255)  NULL,                  -- Voice Bot scope-of-work upload
  sow_stored_name      VARCHAR(255)  NULL,
  sow_size             BIGINT UNSIGNED NULL,
  status               ENUM('pending','paid','fulfilled','cancelled','refunded','failed') NOT NULL DEFAULT 'pending',
  payment_mode         ENUM('sandbox','razorpay') NULL,
  razorpay_order_id    VARCHAR(64)   NULL,
  razorpay_payment_id  VARCHAR(64)   NULL,
  paid_at              DATETIME(3)   NULL,
  notes                TEXT          NULL,
  ip                   VARCHAR(64)   NULL,
  created_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_id (order_id),
  KEY idx_orders_status (status),
  KEY idx_orders_product (product_key),
  KEY idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Line items of a cart-type order (licenses, channels, DIDs, languages…) --
CREATE TABLE IF NOT EXISTS order_items (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_pk  BIGINT UNSIGNED NOT NULL,
  position  SMALLINT      NOT NULL DEFAULT 0,
  label     VARCHAR(190)  NOT NULL,
  sub       VARCHAR(190)  NULL,
  value     DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_pk),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_pk) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time verification codes (email at checkout, phone for the voice demo)
CREATE TABLE IF NOT EXISTS otps (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target      VARCHAR(190)  NOT NULL,                       -- lowercase email or 10-digit phone
  purpose     ENUM('checkout','voice-demo') NOT NULL,
  code_hash   CHAR(64)      NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  DATETIME(3)   NOT NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_otps_target (target, purpose),
  KEY idx_otps_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insights demo uploads (type=audit) and Voice Bot demo calls (type=voice)
CREATE TABLE IF NOT EXISTS demo_sessions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type                ENUM('audit','voice') NOT NULL,
  name                VARCHAR(160)  NOT NULL,
  company             VARCHAR(190)  NOT NULL,
  email               VARCHAR(190)  NOT NULL,
  lob                 VARCHAR(60)   NULL,
  framework           VARCHAR(80)   NULL,
  file_original_name  VARCHAR(255)  NULL,
  file_stored_name    VARCHAR(255)  NULL,
  file_size           BIGINT UNSIGNED NULL,
  audit_status        ENUM('registered','processing','completed','failed') NULL,   -- Insights audit lifecycle
  audit_stage         VARCHAR(30)   NULL,                    -- transcribing | auditing
  audit_error         VARCHAR(500)  NULL,                    -- technical reason, admin-only
  access_token        VARCHAR(64)   NULL,                    -- lets the uploader's browser poll for its own report
  results             LONGTEXT      NULL,                    -- JSON audit report
  transcript          LONGTEXT      NULL,                    -- JSON speaker-labelled transcript
  phone               VARCHAR(30)   NULL,
  industry            VARCHAR(60)   NULL,
  call_type           VARCHAR(60)   NULL,
  gender              VARCHAR(10)   NULL,
  language            VARCHAR(40)   NULL,
  consent             TINYINT(1)    NULL,
  call_status         ENUM('registered','simulated','requested','failed') NOT NULL DEFAULT 'simulated',
  ip                  VARCHAR(64)   NULL,
  created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_demo_type (type),
  KEY idx_demo_phone (type, phone),
  KEY idx_demo_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Discount codes ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(40)   NOT NULL,
  percent      DECIMAL(5,2)  NOT NULL,
  description  VARCHAR(200)  NOT NULL DEFAULT '',
  active       TINYINT(1)    NOT NULL DEFAULT 1,
  valid_from   DATETIME(3)   NULL,
  valid_until  DATETIME(3)   NULL,
  max_uses     INT UNSIGNED  NOT NULL DEFAULT 0,             -- 0 = unlimited
  used_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_promo_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin-editable configuration: site, home, pricing, faqs, chatbot (JSON documents)
CREATE TABLE IF NOT EXISTS settings (
  setting_key  VARCHAR(64)   NOT NULL,
  value        LONGTEXT      NOT NULL,                       -- JSON
  updated_by   VARCHAR(190)  NULL,
  created_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legal pages and admin-created pages, served at /<slug> ----------------------
CREATE TABLE IF NOT EXISTS pages (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(120)  NOT NULL,
  title          VARCHAR(190)  NOT NULL,
  kind           ENUM('legal','custom') NOT NULL DEFAULT 'custom',
  sections       LONGTEXT      NOT NULL,                     -- JSON: [{heading, body}]
  published      TINYINT(1)    NOT NULL DEFAULT 1,
  show_in_footer TINYINT(1)    NOT NULL DEFAULT 1,
  footer_column  ENUM('product','company','legal') NOT NULL DEFAULT 'company',
  sort_order     INT           NOT NULL DEFAULT 100,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
