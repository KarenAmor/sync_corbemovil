// Importamos las funciones del módulo logger que vamos a testear
import * as logger from '../../utils/logger';

// Importamos la conexión simulada a la base de datos de sincronización
import {tempDb } from '../../db/connection';

// Hacemos un mock del módulo de conexión a base de datos para evitar llamadas reales
jest.mock('../../db/connection', () => ({
  tempDb: { query: jest.fn() },
}));

describe('logger', () => {
  // Datos simulados que se usarán para los tests de logs
  const logData = {
    sync_type: 'SYCN',
    record_id: 'TEST123',
    table_name: 'products',
    result: 'Error',
    error_message: 'Something went wrong',
  };

  // Antes de cada test: activamos LOG_DB y limpiamos los mocks
  beforeEach(() => {
    process.env.LOG_DB = 'true';
    jest.clearAllMocks();
  });

  // Test: verificar que se registra un log informativo en la base de datos si LOG_DB = true
  it('should log info to DB when LOG_DB is true', async () => {
    (tempDb.query as jest.Mock).mockResolvedValueOnce([{}]); 
    await logger.logInfo(logData); // ejecutamos el log de tipo info
    expect(tempDb.query).toHaveBeenCalled(); // esperamos que se haya hecho una consulta a la BD
  });

  // Test: verificar que se registra un log de error en la base de datos si LOG_DB = true
  it('should log error to DB when LOG_DB is true', async () => {
    (tempDb.query as jest.Mock).mockResolvedValueOnce([{}]); 
    await logger.logError(logData); // ejecutamos el log de tipo error
    expect(tempDb.query).toHaveBeenCalled(); // esperamos que se haya hecho una consulta a la BD
  });

  // Test: verificar que NO se registra ningún log si LOG_DB = false
  it('should not log if LOG_DB is false', async () => {
    process.env.LOG_DB = 'false'; // desactivamos el log en base de datos
    await logger.logInfo(logData); // ejecutamos logInfo
    expect(tempDb.query).not.toHaveBeenCalled(); // esperamos que NO se haya ejecutado la consulta
  });
});