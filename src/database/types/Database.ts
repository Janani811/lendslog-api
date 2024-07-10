import { PgDatabase } from 'drizzle-orm/pg-core';

import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import * as schema from '../schemas/schema';
import { Client } from 'pg';

export type Database = {
  connection: Client;
  db: PgDatabase<NodePgQueryResultHKT, typeof schema>;
};
