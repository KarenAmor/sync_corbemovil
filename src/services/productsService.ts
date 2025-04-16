import { tempDb, syncDb } from '../db/connection';
import { logError } from '../utils/logger';
import { RowDataPacket } from 'mysql2/promise'; // Importar tipo explícito

export type Product = {
  reference: string;
  name: string;
  packing: string;
  convertion_rate: number;
  vat_group: string;
  vat: number;
  packing_to: string;
  is_active: number;
  modified: Date | null; // Permitir null
  created: Date;
};

// Función para validar un producto
function validateProduct(product: Product): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar reference
  if (!product.reference || product.reference.trim() === '' || product.reference.length > 20) {
    errors.push(`Invalid reference: must be non-empty and up to 20 characters, received: "${product.reference}"`);
  }

  // Validar name
  if (!product.name || product.name.trim() === '' || product.name.length > 50) {
    errors.push(`Invalid name: must be non-empty and up to 50 characters, received: "${product.name}"`);
  }

  // Validar packing
  if (!product.packing || product.packing.trim() === '') {
    errors.push(`Invalid packing: cannot be empty, received: "${product.packing}"`);
  } else if (product.packing.length > 3) {
    errors.push(`Invalid packing: maximum 3 uppercase letters, received: "${product.packing}" (length: ${product.packing.length})`);
  } else if (!/^[A-Z]{1,3}$/.test(product.packing)) {
    errors.push(`Invalid packing: must be a code of 1 to 3 uppercase letters, received: "${product.packing}"`);
  }

  // Validar convertion_rate
  if (product.convertion_rate === null || isNaN(product.convertion_rate) || product.convertion_rate < 0 || product.convertion_rate > 9999999.99999999) {
    errors.push(`Invalid convertion_rate: must be a number between 0 and 9999999.99999999, received: ${product.convertion_rate}`);
  }

  // Validar vat_group
  if (!product.vat_group || product.vat_group.trim() === '' || product.vat_group.length > 10) {
    errors.push(`Invalid vat_group: must be non-empty and up to 10 characters, received: "${product.vat_group}"`);
  }

  // Validar vat
  if (product.vat === null || isNaN(product.vat) || product.vat < 0 || product.vat > 99.99) {
    errors.push(`Invalid vat: must be a number between 0.00 and 99.99, received: ${product.vat}`);
  }

  // Validar packing_to
  if (!product.packing_to || product.packing_to.trim() === '') {
    errors.push(`Invalid packing_to: cannot be empty, received: "${product.packing_to}"`);
  } else if (product.packing_to.length > 3) {
    errors.push(`Invalid packing_to: maximum 3 uppercase letters, received: "${product.packing_to}" (length: ${product.packing_to.length})`);
  } else if (!/^[A-Z]{1,3}$/.test(product.packing_to)) {
    errors.push(`Invalid packing_to: must be a code of 1 to 3 uppercase letters, received: "${product.packing_to}"`);
  }

  // Validar is_active
  if (product.is_active !== 0 && product.is_active !== 1) {
    errors.push(`Invalid is_active: must be 0 or 1, received: ${product.is_active}`);
  }

  // Validar modified
  if (product.modified !== null && (!(product.modified instanceof Date) || isNaN(product.modified.getTime()))) {
    errors.push(`Invalid modified: must be a valid date or null, received: ${product.modified}`);
  }

  // Validar created
  if (!(product.created instanceof Date) || isNaN(product.created.getTime())) {
    errors.push(`Invalid created: must be a valid date, received: ${product.created}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function getProductsBatch(limit = 500): Promise<Product[]> {
  console.log(`Ejecutando getProductsBatch con límite: ${limit}`);
  try {
    const result = await tempDb.query('SELECT * FROM products LIMIT ?', [limit]);
    console.log('Resultado completo de tempDb.query:', result);

    const [rows] = result;
    console.log('Rows extraído:', rows);

    if (!Array.isArray(rows)) {
      console.error('Error: rows no es un array:', rows);
      return [];
    }

    console.log(`Filas obtenidas de tempDb: ${rows.length}`);
    console.log('Primeras 2 filas (si existen):', rows.slice(0, 2));

    return rows as Product[];
  } catch (err: any) {
    console.error('Error en getProductsBatch:', err.message);
    throw err;
  }
}

export async function syncProduct(product: Product): Promise<void> {
  console.log(`Ejecutando syncProduct para referencia: ${product.reference}`);

  // Validar el producto
  const { isValid, errors } = validateProduct(product);
  if (!isValid) {
    console.error(`Producto inválido: ${product.reference}`, errors);
    await logError({
      sync_type: 'Sync',
      record_id: product.reference,
      process: 'products',
      row_data: product,
      result: 'Error',
      error_message: `Validation failed: ${errors.join('; ')}`,
    });
    throw new Error(`Invalid product: ${errors.join('; ')}`);
  }

  // Verificar si el producto ya existe en syncDb
  let existingCreated: Date | null = null;
  try {
    const [rows] = await syncDb.query<RowDataPacket[]>('SELECT created FROM products WHERE reference = ?', [product.reference]);
    if (Array.isArray(rows) && rows.length > 0 && 'created' in rows[0]) {
      existingCreated = new Date(rows[0].created);
      console.log(`Producto existente encontrado para ${product.reference}, created: ${existingCreated}`);
    }
  } catch (err: any) {
    console.error(`Error al verificar producto existente para ${product.reference}:`, err.message);
  }

  // Usar el created existente si el producto ya está en syncDb, o el proporcionado si es nuevo
  const createdToUse = existingCreated || product.created;
  // Usar null para modified en productos nuevos, o product.modified para actualizaciones
  const modifiedToUse = existingCreated ? product.modified : null;

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
      is_active = VALUES(is_active),
      created = created  -- Mantener el created original
  `;

  const values = [
    product.reference,
    product.name,
    product.packing,
    product.vat,
    createdToUse,
    modifiedToUse,
    product.convertion_rate,
    product.vat_group,
    product.packing_to,
    product.is_active,
  ];

  console.log('Valores para syncProduct:', values);

  try {
    const [result] = await syncDb.query(sql, values);
    console.log(`Resultado de syncProduct para ${product.reference}:`, result);
  } catch (err: any) {
    console.error(`Error en syncProduct para ${product.reference}:`, err.message);
    await logError({
      sync_type: 'Sync',
      record_id: product.reference,
      process: 'products',
      result: 'Error',
      error_message: err.message,
    });
    throw err;
  }
}

export async function deleteTempProduct(reference: string): Promise<void> {
  console.log(`Ejecutando deleteTempProduct para referencia: ${reference}`);
  try {
    const [result] = await tempDb.query('DELETE FROM products WHERE TRIM(reference) = ?', [reference.trim()]);
    console.log(`Resultado de deleteTempProduct para ${reference}:`, result);
  } catch (err: any) {
    console.error(`Error en deleteTempProduct para ${reference}:`, err.message);
    throw err;
  }
}