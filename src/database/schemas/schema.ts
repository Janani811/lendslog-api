import { sql } from 'drizzle-orm';
import {
  serial,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  decimal,
  integer,
} from 'drizzle-orm/pg-core';

// gender table
export const gender = pgTable('gender', {
  gen_id: serial('gen_id').primaryKey(),
  gen_name: varchar('gen_name', { length: 100 }),
  gen_created_at: timestamp('gen_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

// payment type table
export const paymentType = pgTable('payment_type', {
  pt_id: serial('pt_id').primaryKey(),
  pt_name: varchar('pt_name', { length: 100 }),
  pt_created_at: timestamp('pt_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

// payment mode table
export const paymentMode = pgTable('payment_mode', {
  pm_id: serial('pm_id').primaryKey(),
  pm_name: varchar('pm_name', { length: 100 }),
  pm_created_at: timestamp('pm_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

// surety type table
export const suretyType = pgTable('surety_type', {
  st_id: serial('st_id').primaryKey(),
  st_name: varchar('st_name', { length: 100 }),
  st_created_at: timestamp('st_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

// user table
export const users = pgTable('users', {
  us_id: serial('us_id').primaryKey(),
  us_name: text('us_name'),
  us_username: text('us_username'),
  us_email: text('us_email'),
  us_password: text('us_password'),
  us_password_salt: text('us_password_salt'),
  us_phone_no: text('us_phone_no'),
  us_address: text('us_address'),
  us_gender: integer('us_gender'),
  us_state: varchar('us_state', { length: 200 }),
  us_district: varchar('us_district', { length: 200 }),
  us_pincode: varchar('us_pincode', { length: 50 }),
  us_active: boolean('us_active').default(false),
  us_type: text('us_type'),
  us_is_deleted: boolean('us_is_deleted').default(false),
  us_verification_token: text('us_verification_token'),
  us_profile_url: text('us_profile_url'),
  us_created_at: timestamp('us_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  us_updated_at: timestamp('us_updated_at', {
    mode: 'date',
    precision: 3,
  }).$onUpdate(() => sql`now()`),
});

// lends table
export const lends = pgTable('lends', {
  ld_id: serial('ld_id').primaryKey(),
  ld_lender_id: integer('ld_lender_id').notNull(),
  // borrower
  ld_borrower_name: varchar('ld_borrower_name', { length: 100 }).notNull(),
  ld_borrower_phoneno: varchar('ld_borrower_phoneno', { length: 20 }).notNull(),
  ld_borrower_address: text('ld_borrower_address'),
  ld_borrower_notes: text('ld_borrower_notes'),
  // nominee
  ld_is_nominee: boolean('ld_is_nominee').default(false),
  ld_nominee_name: varchar('ld_nominee_name', { length: 100 }),
  ld_nominee_phoneno: varchar('ld_nominee_phoneno', { length: 20 }),
  ld_nominee_address: text('ld_nominee_address'),
  ld_nominee_notes: text('ld_nominee_notes'),
  // surety
  ld_is_surety: boolean('ld_is_surety').default(false),
  ld_surety_type: integer('ld_surety_type'),
  ld_surety_notes: text('ld_surety_notes'),
  // lend details
  ld_lend_amount: decimal('ld_lend_amount', { precision: 4 }).notNull(),
  ld_interest_rate: decimal('ld_interest_rate', { precision: 4 }).notNull(),
  ld_total_weeks_or_month: decimal('ld_total_weeks_or_month').notNull(),
  ld_interest_amount: decimal('ld_interest_amount', { precision: 4 }).notNull(),
  ld_base_amount: decimal('ld_base_amount', { precision: 4 }), // calculate based on payment mode for single payment
  ld_payment_mode: integer('ld_payment_mode'), // interest or principal with interest
  ld_payment_type: integer('ld_payment_type').notNull(), // week or month
  ld_borrowed_date: timestamp('ld_borrowed_date', { mode: 'string' })
    .notNull()
    .default(sql`now()`), // current date
  ld_start_date: date('ld_start_date').notNull(),
  ld_end_date: date('ld_end_date').notNull(), // calculate on backend based on start date nad lend details
  ld_created_at: timestamp('ld_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  ld_updated_at: timestamp('ld_updated_at', {
    mode: 'date',
    precision: 3,
  }).$onUpdate(() => sql`now()`),
});
