// Importamos las conexiones a las dos bases de datos: temporal (origen) y sincronizada (destino)
import { tempDb, syncDb } from '../db/connection';

// Definimos el tipo de datos de un producto
export type Product = {
  reference: string;             // Identificador único del producto (clave primaria)
  name: string;                  // Nombre del producto
  packing: string;               // Tipo de empaque
  vat: number;                   // Porcentaje de IVA
  created: Date;                 // Fecha de creación
  modified: Date;                // Fecha de modificación
  convertion_rate: number;      // Tasa de conversión
  vat_group: string;            // Grupo de IVA
  packing_to: string;           // Tipo de empaque secundario
  is_active: number;            // Estado de activación (1 activo, 0 inactivo)
};

// Función para obtener un lote de productos desde la base temporal
// Se utiliza paginación (por defecto, 500 registros)
export async function getProductsBatch(limit = 500): Promise<Product[]> {
  const [rows] = await tempDb.query('SELECT * FROM products LIMIT ?', [limit]);
  return rows as Product[];
}

// Función para insertar o actualizar un producto en la base de datos destino
// Utiliza ON DUPLICATE KEY UPDATE para evitar duplicados
export async function syncProduct(product: Product): Promise<void> {
  const sql = `
    INSERT INTO products (
      reference, name, packing, vat, created, modified,
      convertion_rate, vat_group, packing_to, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      packing = VALUES(packing),
      vat = VALUES(vat),
      modified = VALUES(modified),
      convertion_rate = VALUES(convertion_rate),
      vat_group = VALUES(vat_group),
      packing_to = VALUES(packing_to),
      is_active = VALUES(is_active)
  `;

  // Preparamos los valores a insertar o actualizar
  const values = [
    product.reference,
    product.name,
    product.packing,
    product.vat,
    product.created,
    product.modified,
    product.convertion_rate,
    product.vat_group,
    product.packing_to,
    product.is_active,
  ];

  // Ejecutamos la consulta en la base de datos sincronizada
  await syncDb.query(sql, values);
}

// Función para eliminar un producto de la base temporal (origen)
// Se utiliza TRIM para evitar errores por espacios en el campo 'reference' (tipo CHAR)
export async function deleteTempProduct(reference: string): Promise<void> {
  await tempDb.query('DELETE FROM products WHERE TRIM(reference) = ?', [reference.trim()]);
}