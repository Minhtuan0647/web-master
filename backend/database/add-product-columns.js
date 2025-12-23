const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rare_parfume.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

const alterTableQueries = [
  // Add gender column
  `ALTER TABLE products ADD COLUMN gender VARCHAR(20) DEFAULT 'unisex'`,
  // Add product_type column  
  `ALTER TABLE products ADD COLUMN product_type VARCHAR(50) DEFAULT 'full_bottle'`,
  // Add concentration column
  `ALTER TABLE products ADD COLUMN concentration VARCHAR(50) DEFAULT 'EDP'`,
  // Add origin_country column
  `ALTER TABLE products ADD COLUMN origin_country VARCHAR(100)`,
  // Add release_year column
  `ALTER TABLE products ADD COLUMN release_year INTEGER`,
  // Add is_new_arrival column
  `ALTER TABLE products ADD COLUMN is_new_arrival BOOLEAN DEFAULT 0`,
  // Add is_on_sale column
  `ALTER TABLE products ADD COLUMN is_on_sale BOOLEAN DEFAULT 0`,
  // Add sale_price column
  `ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2)`
];

const createIndexQueries = [
  `CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender)`,
  `CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type)`,
  `CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival)`,
  `CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(is_on_sale)`
];

async function runQuery(query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) {
        // Ignore "duplicate column" errors
        if (err.message.includes('duplicate column name')) {
          console.log(`Column already exists, skipping: ${query.substring(0, 50)}...`);
          resolve();
        } else {
          reject(err);
        }
      } else {
        console.log(`Successfully executed: ${query.substring(0, 50)}...`);
        resolve();
      }
    });
  });
}

async function migrate() {
  console.log('\n=== Starting migration: Add product columns ===\n');

  // Run ALTER TABLE queries
  for (const query of alterTableQueries) {
    try {
      await runQuery(query);
    } catch (err) {
      console.error(`Error executing query: ${err.message}`);
    }
  }

  // Run CREATE INDEX queries
  for (const query of createIndexQueries) {
    try {
      await runQuery(query);
    } catch (err) {
      console.error(`Error executing query: ${err.message}`);
    }
  }

  console.log('\n=== Migration completed ===\n');

  // Verify columns exist
  db.all("PRAGMA table_info(products)", (err, rows) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      console.log('Current products table columns:');
      rows.forEach(row => {
        console.log(`  - ${row.name} (${row.type})`);
      });
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\nDatabase connection closed');
      }
    });
  });
}

migrate();

