import { Module } from '@nestjs/common';
import { DB } from './database.constants';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import connectionOptions from './config/database.config';
import { DatabaseService } from './database.service';
import * as schema from './schemas/schema';
import { ConfigService } from '@nestjs/config';
import { Env } from '../env.interface';
import { repositories } from './repositories';
import { Database } from './types/Database';

@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService<Env>,
      ): Promise<Database> => {
        const connection = new Client(connectionOptions);
        await connection.connect();
        return {
          connection,
          db: drizzle(connection, {
            schema: schema,
            logger: configService.get('NODE_ENV') == 'development',
          }),
        };
      },
    },
    DatabaseService,
    ...repositories,
  ],
  exports: [DB, DatabaseService, ...repositories],
})
export class DatabaseModule {}
