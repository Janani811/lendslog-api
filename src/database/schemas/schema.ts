import { serial, pgTable } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
  user_id: serial('user_id'),
});