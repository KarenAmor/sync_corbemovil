import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Cargamos las variables de entorno
dotenv.config();

// Verificamos que las variables de entorno estén definidas
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'undefined');
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME_TEMP:', process.env.DB_NAME_TEMP);
console.log('DB_NAME_SYNC:', process.env.DB_NAME_SYNC);

// Configuración común para ambas conexiones
const commonConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};

// Verificamos la configuración común
console.log('commonConfig:', {
  host: commonConfig.host,
  user: commonConfig.user,
  password: commonConfig.password ? '[HIDDEN]' : 'undefined',
  port: commonConfig.port,
});

// Creamos el pool para la base de datos temporal
export const tempDb = createPool({
  ...commonConfig,
  database: process.env.DB_NAME_TEMP,
});

// Verificamos que tempDb se haya creado correctamente
console.log('tempDb creado. Probando conexión a tempDb...');
tempDb.getConnection()
  .then(() => console.log('Conexión a tempDb exitosa.'))
  .catch((err) => console.error('Error al conectar a tempDb:', err.message));

// Creamos el pool para la base de datos sincronizada
export const syncDb = createPool({
  ...commonConfig,
  database: process.env.DB_NAME_SYNC,
});

// Verificamos que syncDb se haya creado correctamente
console.log('syncDb creado. Probando conexión a syncDb...');
syncDb.getConnection()
  .then(() => console.log('Conexión a syncDb exitosa.'))
  .catch((err) => console.error('Error al conectar a syncDb:', err.message));