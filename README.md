## 🗉 SYNC-CORBEMOVIL

Proyecto Node.js para sincronizar servicios entre dos bases de datos MySQL utilizando tareas programadas. Implementado con TypeScript, cron, Winston para logging, y TypeORM para soporte adicional.

---

### 🛠️ Tecnologías principales

- **Node.js / TypeScript**
- **MySQL**
- **node-cron**
- **Winston** (con soporte para logs en consola y en base de datos)
- **TypeORM**
- **Jest** para pruebas unitarias

---

### 📁 Estructura del proyecto

```bash
SYNC-CORBEMOVIL/
│
├── src/                  # Código fuente principal
│   ├── db/               # Conexiones a bases de datos
│   ├── services/         # Lógica de negocio (sync, delete, insert)
│   ├── utils/            # Utilidades (logger)
│   └── workers/          # Tareas programadas (cron jobs)
│
├── test/                 # Pruebas unitarias organizadas por módulo
│   ├── services/
│   ├── utils/
│   └── workers/
│
├── .env                  # Variables de entorno
├── package.json
└── tsconfig.json
```

---

### ⚙️ Configuración de entorno `.env`

```env
# Bases de datos
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME_TEMP=movilven_corbeta_sales_temp
DB_NAME_SYNC=movilven_corbeta_sales_sync
DB_SYNCHRONIZE=true
# Tamaño del lote a sincronizar
SYNC_BATCH_SIZE=500
# Cron: cada cuanto se activa
SYNC_CRON_EXPRESSION=*/10 * * * * *
# Activar log en base de datos
LOG_DB=true
```

---

### 🚀 Uso

1. Instalar dependencias:

```bash
npm install
```

2. Compilar TypeScript:

```bash
npm run build
```

3. Ejecutar app:

```bash
npx ts-node src/workers/syncProducts.ts
```

> La tarea cron se ejecutará automáticamente cada X segundos según la configuración.

---

### 📦 Scripts útiles

```json
"scripts": {
  "start": "node dist/src/workers/syncProducts.js",
  "dev": "ts-node src/workers/syncProducts.ts",
  "build": "tsc",
  "test": "jest --coverage",
  "lint": "eslint . --ext .ts"
}
```

---

### ✅ Pruebas

Todas las funciones principales están cubiertas por pruebas unitarias en la carpeta `__test__/`.

Ejecutar tests:

```bash
npm run test
```

---

### 🔍 ¿Qué sincroniza?

- Tabla: `products`
- Campos sincronizados: `reference`, `name`, `packing`, `vat`, `created`, `modified`, `convertion_rate`, `vat_group`, `packing_to`, `is_active`
- Inserta o actualiza si ya existe (usando `ON DUPLICATE KEY UPDATE`)
- Elimina el registro de la tabla temporal si la sincronización fue exitosa

---

### 📜 Logs

Se registran logs de sincronización en:

- La **consola** mediante Winston
- Una tabla `sync_logs` en la base de datos de destino si `LOG_DB=true`.

Campos registrados:

- `sync_type`, `record_id`, `table_name`, `result`, `error_message`, `event_date`

---