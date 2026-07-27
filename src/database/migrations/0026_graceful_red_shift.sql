-- Custom SQL migration file, put you code below! --
CREATE TABLE IF NOT EXISTS "exp_recurring_transactions" (
	"exp_rt_id" serial PRIMARY KEY NOT NULL,
	"exp_rt_user_id" integer NOT NULL,
	"exp_rt_title" text NOT NULL,
	"exp_rt_amount" text NOT NULL,
	"exp_rt_note" text,
	"exp_rt_category_id" integer NOT NULL,
	"exp_rt_transaction_type_id" integer NOT NULL,
	"exp_rt_bank_account_id" integer,
	"exp_rt_frequency" text NOT NULL,
	"exp_rt_start_date" date NOT NULL,
	"exp_rt_end_date" date,
	"exp_rt_next_due_date" date NOT NULL,
	"exp_rt_is_active" boolean DEFAULT true NOT NULL,
	"exp_rt_created_at" timestamp DEFAULT now() NOT NULL,
	"exp_rt_updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "exp_recurring_transactions" ADD CONSTRAINT "exp_recurring_transactions_exp_rt_user_id_exp_users_exp_us_id_fk" FOREIGN KEY ("exp_rt_user_id") REFERENCES "exp_users"("exp_us_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exp_recurring_transactions" ADD CONSTRAINT "exp_recurring_transactions_exp_rt_category_id_exp_transaction_categories_exp_tc_id_fk" FOREIGN KEY ("exp_rt_category_id") REFERENCES "exp_transaction_categories"("exp_tc_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exp_recurring_transactions" ADD CONSTRAINT "exp_recurring_transactions_exp_rt_transaction_type_id_exp_transaction_types_exp_tt_id_fk" FOREIGN KEY ("exp_rt_transaction_type_id") REFERENCES "exp_transaction_types"("exp_tt_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exp_recurring_transactions" ADD CONSTRAINT "exp_recurring_transactions_exp_rt_bank_account_id_exp_bank_accounts_exp_ba_id_fk" FOREIGN KEY ("exp_rt_bank_account_id") REFERENCES "exp_bank_accounts"("exp_ba_id") ON DELETE set null ON UPDATE no action;
