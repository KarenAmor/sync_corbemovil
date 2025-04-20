// Importamos el servicio que vamos a testear
import * as productService from '../../services/productsService';

// Importamos las conexiones a las bases de datos temporal y de sincronización
import { tempDb, syncDb } from '../../db/connection';

// Hacemos un mock de las conexiones a las bases de datos para evitar llamadas reales
jest.mock('../../db/connection', () => ({
  tempDb: { query: jest.fn() },  // simulamos que tempDb.query es una función jest
  syncDb: { query: jest.fn() },  // simulamos que syncDb.query es una función jest
}));

describe('productService', () => {
  // Creamos un producto simulado para usar en los tests
  const mockProduct = {
    reference: 'PRD001',
    name: 'Test Product',
    packing: 'UNI',
    vat: 19,
    created: new Date(),
    modified: new Date(),
    convertion_rate: 1.0,
    vat_group: 'A',
    packing_to: 'UNI',
    is_active: 1,
  };

  // Test para verificar que getProductsBatch obtiene correctamente los productos
  it('should get a batch of products', async () => {
    // Simulamos que la base de datos devuelve un array de productos
    (tempDb.query as jest.Mock).mockResolvedValue([[mockProduct]]);

    // Llamamos a la función y verificamos que devuelva el producto esperado
    const result = await productService.getProductsBatch(1);
    expect(result).toEqual([mockProduct]);

    // Verificamos que se haya llamado con el SQL correcto y el límite indicado
    expect(tempDb.query).toHaveBeenCalledWith('SELECT * FROM products LIMIT ?', [1]);
  });

  // Test para verificar que syncProduct funciona sin errores
  it('should sync a product without error', async () => {
    // Simulamos que la consulta a la base de datos de sincronización se resuelve correctamente
    (syncDb.query as jest.Mock).mockResolvedValueOnce([]);
    // Simular INSERT/UPDATE
    (syncDb.query as jest.Mock).mockResolvedValueOnce([{}]);
    // Verificamos que la función se resuelve correctamente (sin lanzar errores)
    await expect(productService.syncProduct(mockProduct)).resolves.toBeUndefined();
  });

  // Test para verificar que deleteTempProduct elimina un producto de la base TEMP
  it('should delete a product from TEMP', async () => {
    // Simulamos que la eliminación se realiza correctamente
    (tempDb.query as jest.Mock).mockResolvedValueOnce([]);

    // Llamamos a la función para eliminar el producto
    await productService.deleteTempProduct('PRD001');

    // Verificamos que se haya ejecutado la consulta SQL esperada
    expect(tempDb.query).toHaveBeenCalledWith(
      'DELETE FROM products WHERE TRIM(reference) = ?',
      ['PRD001']
    );
  });
});