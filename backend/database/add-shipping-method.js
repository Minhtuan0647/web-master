const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rare_parfume.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Adding shipping_method column to orders table...');

const migrations = [
  `ALTER TABLE orders ADD COLUMN shipping_method VARCHAR(50) DEFAULT 'standard'`,
];

db.serialize(() => {
  migrations.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✅ Column already exists, skipping: ${sql}`);
        } else {
          console.error(`❌ Error executing migration ${index + 1}:`, err.message);
        }
      } else {
        console.log(`✅ Migration ${index + 1} completed successfully`);
      }
    });
  });

  // Verify the column was added
  db.all("PRAGMA table_info(orders)", (err, rows) => {
    if (err) {
      console.error('❌ Error checking table info:', err);
      db.close();
      return;
    }

    console.log('\n📋 Current orders table structure:');
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });

    const hasShippingMethod = rows.some(row => row.name === 'shipping_method');
    if (hasShippingMethod) {
      console.log('\n✅ shipping_method column successfully added to orders table!');
    } else {
      console.log('\n⚠️  shipping_method column not found. Please check the migration.');
    }

    db.close();
  });
});

