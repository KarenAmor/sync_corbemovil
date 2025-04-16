// Importamos dotenv para poder usar variables del archivo .env
import * as dotenv from 'dotenv';

// Importamos node-cron para ejecutar tareas programadas (cronjobs)
import * as cron from 'node-cron';

// Importamos funciones del servicio de productos
import { getProductsBatch, syncProduct, deleteTempProduct, Product } from '../services/productsService';

// Importamos funciones para registrar logs
import { logInfo, logError } from '../utils/logger';

// Cargamos las variables de entorno
dotenv.config();

// Verificamos que las variables de entorno estén cargadas
console.log('SYNC_BATCH_SIZE:', process.env.SYNC_BATCH_SIZE);
console.log('SYNC_CRON_EXPRESSION:', process.env.SYNC_CRON_EXPRESSION);

// Definimos el tamaño del lote de sincronización
const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '500');
console.log('BATCH_SIZE usado:', BATCH_SIZE);

// Función principal que procesa un lote de productos
async function syncBatch(): Promise<void> {
  console.log('Iniciando syncBatch...');
  
  // Obtenemos el lote desde la base temporal
  const products: Product[] = await getProductsBatch(BATCH_SIZE);
  console.log('Productos obtenidos:', products.length);
  console.log('Primeros 2 productos (si existen):', products.slice(0, 2));

  if (!products.length) {
    console.log('No hay productos para procesar. Finalizando syncBatch.');
    return;
  }

  // Recorremos todos los productos del lote
  for (const p of products) {
    console.log(`Procesando producto con referencia: ${p.reference}`);
    try {
      // Intentamos insertar o actualizar el producto
      console.log('Llamando a syncProduct para:', p.reference);
      await syncProduct(p);
      console.log(`Producto sincronizado exitosamente: ${p.reference}`);

      // Eliminamos el producto de la base temporal
      console.log(`Eliminando producto temporal: ${p.reference}`);
      await deleteTempProduct(p.reference);
      console.log(`Producto eliminado de temporal: ${p.reference}`);

    } catch (err: any) {
      console.error(`Error procesando producto ${p.reference}:`, err.message);
      // Registramos el error en la tabla de logs
      await logError({
        sync_type: 'Sync',
        record_id: p.reference,
        process: 'products',
        row_data: p,
        result: 'Error',
        error_message: err.message,
      });
    }
  }

  // Verificamos si hay más lotes
  console.log(`Lote procesado. Tamaño del lote: ${products.length}, BATCH_SIZE: ${BATCH_SIZE}`);
  if (products.length === BATCH_SIZE) {
    console.log('Posiblemente hay más lotes. Llamando a syncBatch recursivamente.');
    await syncBatch();
  } else {
    console.log('No hay más lotes para procesar.');
  }
}

// Programamos el cronjob
console.log('Programando cronjob...');
cron.schedule(process.env.SYNC_CRON_EXPRESSION || '*/10 * * * * *', async () => {
  console.log('Cronjob iniciado:', new Date().toISOString());
  
  // Logueamos el inicio
  await logInfo({ sync_type: 'Sync', process: 'products', result: 'Start' });
  console.log('Log de inicio registrado.');

  // Ejecutamos la sincronización
  await syncBatch();
  console.log('Sincronización completada.');

  // Logueamos la finalización
  await logInfo({ sync_type: 'Sync', process: 'products', result: 'End' });
  console.log('Log de finalización registrado.');
});

export { syncBatch };