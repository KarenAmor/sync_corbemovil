import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const commonConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};

export const tempDb = createPool({
  ...commonConfig,
  database: process.env.DB_NAME_TEMP,
});

export const syncDb = createPool({
  ...commonConfig,
  database: process.env.DB_NAME_SYNC,
});