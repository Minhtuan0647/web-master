const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'rare_parfume.db');

// SQL statements to create customers and blogs tables
const createTablesSQL = `
-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Vietnam',
    date_of_birth DATE,
    gender VARCHAR(20),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    vip_status VARCHAR(50) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author VARCHAR(100) DEFAULT 'Rare Parfume Team',
    category VARCHAR(100),
    tags TEXT DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_vip_status ON customers(vip_status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(is_featured);
`;

async function createTables() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to connect to database:', err.message);
        return reject(err);
      }
      console.log('✅ Connected to database');
    });

    db.serialize(() => {
      db.exec('PRAGMA foreign_keys = ON');

      // Check if tables already exist
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'", (err, row) => {
        if (err) {
          console.error('❌ Error checking customers table:', err.message);
          db.close();
          return reject(err);
        }

        if (row) {
          console.log('⚠️  Table "customers" already exists');
        } else {
          console.log('📝 Creating "customers" table...');
        }

        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='blogs'", (err, row) => {
          if (err) {
            console.error('❌ Error checking blogs table:', err.message);
            db.close();
            return reject(err);
          }

          if (row) {
            console.log('⚠️  Table "blogs" already exists');
          } else {
            console.log('📝 Creating "blogs" table...');
          }

          // Execute CREATE TABLE statements
          db.exec(createTablesSQL, (err) => {
            if (err) {
              console.error('❌ Error creating tables:', err.message);
              db.close();
              return reject(err);
            }

            console.log('✅ Successfully created customers and blogs tables');
            console.log('✅ Indexes created');

            // Verify tables were created
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('customers', 'blogs')", (err, rows) => {
              if (err) {
                console.error('❌ Error verifying tables:', err.message);
                db.close();
                return reject(err);
              }

              console.log('\n📊 Created tables:');
              rows.forEach((row) => {
                console.log(`   - ${row.name}`);
              });

              // Show table structure
              db.all("PRAGMA table_info(customers)", (err, columns) => {
                if (!err && columns.length > 0) {
                  console.log('\n📋 Customers table structure:');
                  columns.forEach((col) => {
                    console.log(`   - ${col.name} (${col.type})`);
                  });
                }

                db.all("PRAGMA table_info(blogs)", (err, columns) => {
                  if (!err && columns.length > 0) {
                    console.log('\n📋 Blogs table structure:');
                    columns.forEach((col) => {
                      console.log(`   - ${col.name} (${col.type})`);
                    });
                  }

                  db.close((err) => {
                    if (err) {
                      console.error('❌ Error closing database:', err.message);
                      return reject(err);
                    }
                    console.log('\n✅ Database connection closed');
                    resolve();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Run the script
createTables()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

