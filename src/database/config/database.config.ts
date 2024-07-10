import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Env } from '../../env.interface';
import { ConnectionConfig } from 'pg';

config();

const configService = new ConfigService<Env>();

let connectionOptions: ConnectionConfig;

if (configService.get('NODE_ENV') == 'production') {
  connectionOptions = {
    host: configService.get('DB_HOST'),
    user: configService.get('DB_USER'),
    database: configService.get('DB_NAME'),
    password: configService.get('DB_PASSWORD'),
  };
} else if (
  configService.get('NODE_ENV') == 'development' ||
  configService.get('NODE_ENV') == 'staging'
) {
  connectionOptions = {
    host: configService.get('DB_HOST'),
    user: configService.get('DB_USER'),
    database: configService.get('DB_NAME'),
    password: configService.get('DB_PASSWORD'),
    port: configService.get('DB_PORT'),
  };
}

export default connectionOptions;
