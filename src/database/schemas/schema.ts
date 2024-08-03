import { type InferInsertModel, type InferSelectModel, relations, sql } from 'drizzle-orm';
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

// payment Term table
export const paymentTerm = pgTable('payment_term', {
  pterm_id: serial('pterm_id').primaryKey(),
  pterm_name: varchar('pterm_name', { length: 100 }),
  pterm_created_at: timestamp('pterm_created_at', { mode: 'string' })
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
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
});

export type InsertUser = InferInsertModel<typeof users>;
export type SelectUser = InferSelectModel<typeof users>;

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
  ld_lend_amount: decimal('ld_lend_amount', { precision: 20, scale: 4 }).notNull(),
  ld_interest_rate: decimal('ld_interest_rate', { precision: 10 }).notNull(),
  ld_total_weeks_or_month: decimal('ld_total_weeks_or_month').notNull(),
  ld_interest_amount: decimal('ld_interest_amount', { precision: 20, scale: 4 }), // notNull()
  ld_principal_repayment: decimal('ld_principal_repayment', { precision: 20, scale: 4 }), // calculate based on payment mode for single payment
  ld_payment_term: integer('ld_payment_term').notNull(), // interest or principal with interest
  ld_payment_type: integer('ld_payment_type'), // notNull() // week or month
  ld_borrowed_date: timestamp('ld_borrowed_date', { mode: 'string' })
    .notNull()
    .default(sql`now()`), // current date
  ld_start_date: date('ld_start_date'), // notNull(),
  ld_end_date: date('ld_end_date'), // notNull(), // calculate on backend based on start date nad lend details
  ld_created_at: timestamp('ld_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  ld_updated_at: timestamp('ld_updated_at', {
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
  ld_lend_status: integer('ld_lend_status').default(1), // 1=Pending, 2=Completed (installment payments)
  ld_is_deleted: integer('ld_is_deleted').default(0),
});

// lends relations
export const lendsRelation = relations(lends, ({ many }) => ({
  installmentTimelines: many(installmentTimelines),
}));

// Installment Timelines
export const installmentTimelines = pgTable('installment_timeline', {
  it_id: serial('it_id').primaryKey(),
  it_lend_id: integer('it_lend_id').notNull(), // lends id
  it_installment_date: date('it_installment_date').notNull(),
  it_installement_status: integer('it_installement_status').default(1),
  it_created_at: timestamp('it_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  it_updated_at: timestamp('it_updated_at', {
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
  it_order: integer('it_order'),
  it_is_deleted: integer('it_is_deleted').default(0),
  it_term_amount: decimal('it_term_amount', { precision: 20, scale: 4 }),
});

// Installement Relations
export const installmentTimelineRelations = relations(installmentTimelines, ({ one }) => ({
  lend: one(lends, {
    fields: [installmentTimelines.it_lend_id],
    references: [lends.ld_id],
  }),
}));

// Notifications
export const notification = pgTable('notification', {
  nt_id: serial('nt_id').primaryKey(),
  nt_user_id: integer('nt_user_id').notNull(), // users id
  nt_status: integer('nt_status').default(1), // 1=Pending, 2=Send
  nt_created_at: timestamp('nt_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  nt_updated_at: timestamp('nt_updated_at', {
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
  nt_is_deleted: integer('nt_is_deleted').default(0),
  nt_text: text('nt_text'),
  nt_pending_count: integer('nt_pending_count'),
});

export type InsertNotification = InferInsertModel<typeof notification>;
