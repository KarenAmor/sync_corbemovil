// Importamos Winston, una biblioteca para logs (registros)
import * as winston from 'winston';

// Importamos la conexión a la base de datos de sincronización
import { syncDb } from '../db/connection';

// Creamos un logger de Winston que imprime los logs en consola
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

// Definimos el tipo de datos para un log
type LogData = {
  sync_type?: string;        // Tipo de sincronización (por ejemplo, "Sync")
  record_id?: string;        // ID del registro relacionado con el log
  table_name?: string;       // Nombre de la tabla afectada
  data?: any;                // Información adicional (actualmente no se usa)
  result?: string;           // Resultado del proceso (por ejemplo: "Error", "Start", "End")
  error_message?: string;    // Mensaje de error si lo hay
};

// Función para guardar un log en la base de datos
async function logToDb(level: string, data: LogData): Promise<void> {
  // Solo guardar si la variable LOG_DB está activada en .env
  if (process.env.LOG_DB !== 'true') return;

  // Consulta SQL para insertar en la tabla sync_logs
  const sql = `
    INSERT INTO sync_logs (sync_type, record_id, table_name, data, event_date, result, error_message)
    VALUES (?, ?, ?, ?, NOW(), ?, ?)
  `;

  // Preparamos los valores para insertar
  const values = [
    data.sync_type || null,        // Tipo de sincronización
    data.record_id || null,        // ID del registro
    data.table_name || null,       // Tabla relacionada
    null,                          // El campo data se deja vacío según los requisitos del PDF
    data.result || level,          // Resultado del evento (info, error, etc.)
    data.error_message || null,    // Mensaje de error (si aplica)
  ];

  // Ejecutamos la consulta
  await syncDb.query(sql, values);
}

// Función para registrar un log informativo
export async function logInfo(data: LogData) {
  logger.info(data);         // Imprime en consola
  await logToDb('info', data); // Guarda en la BD
}

// Función para registrar un log de error
export async function logError(data: LogData) {
  logger.error(data);         // Imprime en consola
  await logToDb('error', data); // Guarda en la BD
}