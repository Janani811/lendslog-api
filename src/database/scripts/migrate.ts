import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import connectionOptions from '../config/database.config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

async function runMigration() {
  const connection = new Client(connectionOptions);
  const db = drizzle(connection);

  console.log('Running migrations....');
  await migrate(db, {
    migrationsFolder: 'src/database/migrations',
    migrationsTable: 'migrations',
  });
  console.log('Migration Successfull!');
  process.exit();
}

runMigration();
