// Importamos el tipo Product y las funciones del servicio de productos
import { Product } from '../../services/productsService';
import * as productService from '../../services/productsService';

// Importamos el módulo de logging
import * as logger from '../../utils/logger';

// Importamos la función principal que queremos testear (el batch de sincronización)
import { syncBatch } from '../../workers/syncProducts';

// Hacemos mock de los módulos para evitar efectos reales (consultas o logs)
jest.mock('../../services/productsService');
jest.mock('../../utils/logger');

describe('syncBatch', () => {
  // Creamos un producto simulado que usaremos en ambos tests
  const mockProducts: Product[] = [
    {
      reference: 'P1',
      name: 'Product 1',
      packing: 'UNI',
      vat: 19,
      created: new Date(),
      modified: new Date(),
      convertion_rate: 1,
      vat_group: 'A',
      packing_to: 'UNI',
      is_active: 1,
    },
  ];

  // Antes de cada test, limpiamos todos los mocks para evitar interferencias
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: sincronizar y eliminar productos exitosamente
  it('should sync and delete each product', async () => {
    // Simulamos que se obtiene el producto desde la base de datos temporal
    (productService.getProductsBatch as jest.Mock).mockResolvedValueOnce(mockProducts);

    // Simulamos que la sincronización y eliminación se ejecutan sin errores
    (productService.syncProduct as jest.Mock).mockResolvedValue(undefined);
    (productService.deleteTempProduct as jest.Mock).mockResolvedValue(undefined);

    // Ejecutamos el batch
    await syncBatch();

    // Verificamos que se haya intentado sincronizar y luego eliminar el producto
    expect(productService.syncProduct).toHaveBeenCalledWith(mockProducts[0]);
    expect(productService.deleteTempProduct).toHaveBeenCalledWith('P1');
  });

  // Test: manejar errores al sincronizar un producto
  it('should log errors when sync fails', async () => {
    const error = new Error('Failed sync');

    // Simulamos que se obtiene el producto, pero ocurre un error al sincronizar
    (productService.getProductsBatch as jest.Mock).mockResolvedValueOnce(mockProducts);
    (productService.syncProduct as jest.Mock).mockRejectedValueOnce(error);

    // Ejecutamos el batch
    await syncBatch();

    // Verificamos que se haya registrado un error con la información adecuada
    expect(logger.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        record_id: 'P1',
        error_message: 'Failed sync',
      })
    );
  });
});