import { sql } from 'drizzle-orm';
import { serial, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  us_id: serial('us_id').primaryKey(),
  us_name: text('us_name'),
  us_email: text('us_email'),
  us_password: text('us_password'),
  us_password_salt: text('us_password_salt'),
  us_photo_url: text('us_photo_url'),
  us_active: text('us_active'),
  us_type: text('us_type'),
  us_is_deleted: text('us_is_deleted'),
  us_verification_token: text('us_verification_token'),
  us_address: text('us_address'),
  us_phone_no: text('us_phone_no'),
  us_created_at: timestamp('us_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});
