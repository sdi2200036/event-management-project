-- Event Management System - PostgreSQL Schema
-- Run this file to initialize the database

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'participant');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(30),
  address         VARCHAR(255),
  city            VARCHAR(100),
  country         VARCHAR(100),
  postal_code     VARCHAR(20),
  geo_lat         DOUBLE PRECISION,
  geo_lng         DOUBLE PRECISION,
  afm             VARCHAR(20) UNIQUE NOT NULL,
  role            user_role NOT NULL DEFAULT 'participant',
  status          user_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  event_type      VARCHAR(100),
  venue           VARCHAR(255),
  address         VARCHAR(255),
  city            VARCHAR(100),
  country         VARCHAR(100),
  geo_lat         DOUBLE PRECISION,
  geo_lng         DOUBLE PRECISION,
  start_datetime  TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime    TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity        INTEGER NOT NULL DEFAULT 0,
  organizer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          event_status NOT NULL DEFAULT 'DRAFT',
  description     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event categories (many per event)
CREATE TABLE IF NOT EXISTS event_categories (
  event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category        VARCHAR(100) NOT NULL,
  PRIMARY KEY (event_id, category)
);

-- Event photos (photo_url stored as base64 data URL or external URL)
CREATE TABLE IF NOT EXISTS event_photos (
  id              SERIAL PRIMARY KEY,
  event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL
);

-- Ticket types per event
CREATE TABLE IF NOT EXISTS ticket_types (
  id              SERIAL PRIMARY KEY,
  event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  quantity        INTEGER NOT NULL DEFAULT 0,
  available       INTEGER NOT NULL DEFAULT 0
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id                SERIAL PRIMARY KEY,
  event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_type_id    INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  number_of_tickets INTEGER NOT NULL DEFAULT 1,
  total_cost        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  booking_status    booking_status NOT NULL DEFAULT 'PENDING',
  booked_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id                    SERIAL PRIMARY KEY,
  sender_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id            INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  subject               VARCHAR(255) NOT NULL,
  body                  TEXT NOT NULL,
  is_read               BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by_sender     BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by_receiver   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Event views (for recommendation tracking)
CREATE TABLE IF NOT EXISTS event_views (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_attendee ON bookings(attendee_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_event_views_user ON event_views(user_id);

-- Default admin user (password: admin123)
INSERT INTO users (username, password_hash, first_name, last_name, email, afm, role, status)
VALUES (
  'admin',
  '$2a$10$UGUQxCZj.LzWwWLyg2ej7euJcOTPYT24.H32Wo4SgQV4T6MZQ1ukm',
  'System',
  'Admin',
  'admin@eventmanagement.com',
  '000000000',
  'admin',
  'approved'
) ON CONFLICT (username) DO NOTHING;


--ignore below instructions , previous implementation , might revisit later
-- NOTE: Generate a real bcrypt hash before deploying:
-- node -e "const b=require('bcryptjs'); b.hash('admin123',10).then(h=>console.log(h))"
