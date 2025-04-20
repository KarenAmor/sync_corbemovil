import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

// Pool conexión a base de datos de ORIGEN
export const tempDb = createPool({
  host: process.env.DB_HOST_ORIGIN,
  user: process.env.DB_USERNAME_ORIGIN,
  password: process.env.DB_PASSWORD_ORIGIN,
  port: Number(process.env.DB_PORT_ORIGIN),
  database: process.env.DB_NAME_ORIGIN,
});

// Verificación conexión ORIGEN
tempDb.getConnection()
  .then(() => console.log('✅ Successfully connected to ORIGIN database.'))
  .catch((err) => console.error('❌ Failed to connect to ORIGIN database:', err.message));

// Pool conexión a base de datos de DESTINO
export const syncDb = createPool({
  host: process.env.DB_HOST_DESTINATION,
  user: process.env.DB_USERNAME_DESTINATION,
  password: process.env.DB_PASSWORD_DESTINATION,
  port: Number(process.env.DB_PORT_DESTINATION),
  database: process.env.DB_NAME_SYNC_DESTINATION,
});

// Verificación conexión DESTINO
syncDb.getConnection()
  .then(() => console.log('✅ Successfully connected to DESTINATION database.'))
  .catch((err) => console.error('❌ Failed to connect to DESTINATION database:', err.message));