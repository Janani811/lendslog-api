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

// Notification Relations
export const notificationRelations = relations(notification, ({ many }) => ({
  notificationToken: many(notificationToken),
}));

export type InsertNotification = InferInsertModel<typeof notification>;

// NotificationToken
export const notificationToken = pgTable('notificationToken', {
  ntto_id: serial('ntto_id').primaryKey(),
  ntto_user_id: integer('ntto_user_id').notNull(), // users id(us_id)
  ntto_notification_id: integer('ntto_notification_id'), // notification id(nt_id)
  ntto_token: varchar('ntto_token'),
  ntto_status: integer('ntto_status').default(1), // 0=InActive, 1=Active
  ntto_created_at: timestamp('ntto_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  ntto_updated_at: timestamp('ntto_updated_at', {
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
});

// Notification Token Relations
export const notificationTokenRelations = relations(notificationToken, ({ one }) => ({
  notification: one(notification, {
    fields: [notificationToken.ntto_user_id],
    references: [notification.nt_user_id],
  }),
}));

export type InsertNotificationToken = InferInsertModel<typeof notificationToken>;
export type UpdateNotificationToken = InferSelectModel<typeof notificationToken>;

export const expensify_users = pgTable('exp_users', {
  exp_us_id: serial('exp_us_id').primaryKey(),
  exp_us_clerk_id: varchar('exp_us_clerk_id', { length: 255 }).notNull().unique(),
  exp_us_name: text('exp_us_name'),
  exp_us_email: text('exp_us_email'),
  exp_us_phone_no: text('exp_phone_no'),
  exp_us_is_deleted: boolean('exp_us_is_deleted').default(false),
  exp_us_profile_url: text('exp_us_profile_url'),
  exp_us_created_at: timestamp('exp_us_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  exp_us_updated_at: timestamp('exp_us_updated_at', {
    mode: 'string',
  }).$onUpdate(() => sql`now()`),
});

export type InsertExpensifyUser = InferInsertModel<typeof expensify_users>;
export type SelectExpensifyUser = InferSelectModel<typeof expensify_users>;

export const expTransactionTypes = pgTable('exp_transaction_types', {
  exp_tt_id: serial('exp_tt_id').primaryKey(),
  exp_tt_label: text('exp_tt_label').notNull(),
});

export type InsertExpensifyTransactionTypes = InferInsertModel<typeof expTransactionTypes>;
export type SelectExpensifyTransactionTypes = InferSelectModel<typeof expTransactionTypes>;

export const expTransactionCategories = pgTable('exp_transaction_categories', {
  exp_tc_id: serial('exp_tc_id').primaryKey(),
  exp_tc_label: text('exp_tc_label').notNull(),
  exp_tc_icon: text('exp_tc_icon'),
  exp_tc_user_id: integer('exp_tc_user_id'),
  exp_tc_icon_bg_color: varchar('exp_tc_icon_bg_color', { length: 10 }),
  exp_tc_transaction_type: integer('exp_tc_transaction_type')
    .notNull()
    .references(() => expTransactionTypes.exp_tt_id, { onDelete: 'cascade' }),
  exp_tc_created_at: timestamp('exp_tc_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),

  exp_tc_updated_at: timestamp('exp_tc_updated_at', { mode: 'string' }).$onUpdate(() => sql`now()`),
  exp_tc_sort_order: integer('exp_tc_sort_order').notNull().default(1),
});

export type InsertExpensifyTransactionCategories = InferInsertModel<
  typeof expTransactionCategories
>;
export type SelectExpensifyTransactionCategories = InferSelectModel<
  typeof expTransactionCategories
>;

export const expTransactions = pgTable('exp_transactions', {
  exp_ts_id: serial('exp_ts_id').primaryKey(),
  exp_ts_user_id: integer('exp_ts_user_id')
    .notNull()
    .references(() => expensify_users.exp_us_id, { onDelete: 'cascade' }),
  exp_ts_title: text('exp_ts_title').notNull(),
  exp_ts_amount: text('exp_ts_amount').notNull(),
  exp_ts_date: date('exp_ts_date').notNull(),
  exp_ts_time: text('exp_ts_time').notNull(),
  exp_ts_note: text('exp_ts_note'),
  exp_ts_transaction_type: integer('exp_ts_transaction_type')
    .notNull()
    .references(() => expTransactionTypes.exp_tt_id),
  exp_ts_category: integer('exp_ts_category')
    .notNull()
    .references(() => expTransactionCategories.exp_tc_id),
  exp_ts_created_at: timestamp('exp_ts_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),

  exp_ts_updated_at: timestamp('exp_ts_updated_at', { mode: 'string' }).$onUpdate(() => sql`now()`),
});

export type InsertExpensifyTransactions = InferInsertModel<typeof expTransactions>;
export type SelectExpensifyTransactions = InferSelectModel<typeof expTransactions>;

export const expBankAccounts = pgTable('exp_bank_accounts', {
  exp_ba_id: serial('exp_ba_id').primaryKey(),

  exp_ba_user_id: integer('exp_ba_user_id')
    .notNull()
    .references(() => expensify_users.exp_us_id, { onDelete: 'cascade' }),

  exp_ba_name: text('exp_ba_name').notNull(),

  exp_ba_balance: varchar('exp_ba_balance'),

  exp_ba_currency: varchar('exp_ba_currency', { length: 10 }).default('INR'),
  exp_ba_type: varchar('exp_ba_type', { length: 20 }).default('bank'),

  exp_ba_icon: varchar('exp_ba_icon', { length: 50 }),
  exp_ba_color: varchar('exp_ba_color', { length: 10 }),

  exp_ba_is_primary: boolean('exp_ba_is_primary').default(false),

  exp_ba_is_active: integer('exp_ba_is_active').default(1),

  exp_ba_is_deleted: boolean('exp_ba_is_deleted').default(false),

  exp_ba_created_at: timestamp('exp_ba_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),

  exp_ba_updated_at: timestamp('exp_ba_updated_at', { mode: 'string' }).$onUpdate(() => sql`now()`),
});

export type InsertExpensifyBankAccounts = InferInsertModel<typeof expBankAccounts>;
export type SelectExpensifyBankAccounts = InferSelectModel<typeof expBankAccounts>;

export const expStarredTransactions = pgTable('exp_starred_transactions', {
  exp_st_id: serial('exp_st_id').primaryKey(),

  exp_st_user_id: integer('exp_st_user_id')
    .notNull()
    .references(() => expensify_users.exp_us_id, { onDelete: 'cascade' }),

  exp_st_transaction_id: integer('exp_st_transaction_id')
    .notNull()
    .references(() => expTransactions.exp_ts_id, { onDelete: 'cascade' }),

  exp_st_created_at: timestamp('exp_st_created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type InsertExpensifyStarredTransactions = InferInsertModel<typeof expStarredTransactions>;
export type SelectExpensifyStarredTransactions = InferSelectModel<typeof expStarredTransactions>;
