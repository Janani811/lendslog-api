import { PgDatabase } from 'drizzle-orm/pg-core';
import { Client } from 'pg';
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';

import * as schema from '../schemas/schema';

export type Database = {
  connection: Client;
  db: PgDatabase<NodePgQueryResultHKT, typeof schema>;
};
