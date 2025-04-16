import * as winston from 'winston';
import { tempDb } from '../db/connection';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

type LogData = {
  sync_type?: string;
  record_id?: string;
  process?: string;
  row_data?: any;
  result?: string;
  error_message?: string;
};

async function logToDb(level: string, data: LogData): Promise<void> {
  console.log(`Ejecutando logToDb con nivel: ${level}, datos:`, data);
  if (process.env.LOG_DB !== 'true') {
    console.log('LOG_DB no está activo. No se guarda en BD.');
    return;
  }

  const sql = `
    INSERT INTO sync_logs (sync_type, record_id, process, row_data, event_date, result, error_message)
    VALUES (?, ?, ?, ?, NOW(), ?, ?)
  `;

  const values = [
    data.sync_type || null,
    data.record_id || null, // Ahora compatible con record_id NULL
    data.process || null,
    null, // El campo data se deja vacío según los requisitos
    data.result || level,
    data.error_message || null,
  ];

  console.log('Valores para logToDb:', values);

  try {
    const [result] = await tempDb.query(sql, values);
    console.log('Resultado de logToDb:', result);
  } catch (err: any) {
    console.error('Error en logToDb:', err.message);
    throw err;
  }
}

export async function logInfo(data: LogData) {
  console.log('Registrando logInfo:', data);
  logger.info(data);
  await logToDb('info', data);
}

export async function logError(data: LogData) {
  console.log('Registrando logError:', data);
  logger.error(data);
  await logToDb('error', data);
}