// Importamos dotenv para poder usar variables del archivo .env
import * as dotenv from 'dotenv';

// Importamos node-cron para ejecutar tareas programadas (cronjobs)
import * as cron from 'node-cron';

// Importamos funciones del servicio de productos: obtener lote, sincronizar producto y eliminarlo
import { getProductsBatch, syncProduct, deleteTempProduct, Product } from '../services/productsService';

// Importamos funciones para registrar logs de información y errores
import { logInfo, logError } from '../utils/logger';

// Cargamos las variables de entorno desde el archivo .env
dotenv.config();

// Definimos el tamaño del lote de sincronización (por defecto 500)
const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '500');

// Función principal que procesa un lote de productos
async function syncBatch(): Promise<void> {
  // Obtenemos el lote desde la base temporal
  const products: Product[] = await getProductsBatch(BATCH_SIZE);
  if (!products.length) return; // Si no hay productos, se termina

  // Recorremos todos los productos del lote
  for (const p of products) {
    try {
      // Intentamos insertar o actualizar el producto en la base de destino
      await syncProduct(p);

      // Si fue exitoso, eliminamos el producto de la base temporal
      await deleteTempProduct(p.reference);

    } catch (err: any) {
      // Si hay un error, lo registramos en la tabla de logs
      await logError({
        sync_type: 'Sync',            // Tipo de log: sincronización
        record_id: p.reference,       // ID del registro que falló
        table_name: 'products',       // Nombre de la tabla
        data: p,                      // Contenido del producto (se puede eliminar si el log debe ir vacío)
        result: 'Error',              // Resultado: error
        error_message: err.message,   // Mensaje de error
      });
    }
  }

  // Si el número de productos procesados es igual al tamaño del lote,
  // asumimos que podrían haber más y llamamos de nuevo a la función (recursividad controlada)
  if (products.length === BATCH_SIZE) {
    await syncBatch();
  }
}

// Programamos el cronjob para que se ejecute según el intervalo definido en .env
// Por defecto, se ejecuta cada 10 segundos
cron.schedule(process.env.SYNC_CRON_EXPRESSION || '*/10 * * * * *', async () => {
  // Logueamos el inicio de la sincronización
  await logInfo({ sync_type: 'Sync', table_name: 'products', result: 'Start' });

  // Ejecutamos la sincronización de productos
  await syncBatch();

  // Logueamos la finalización de la sincronización
  await logInfo({ sync_type: 'Sync', table_name: 'products', result: 'End' });
});

export { syncBatch };