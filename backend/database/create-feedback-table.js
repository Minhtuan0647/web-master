const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rare_parfume.db');

// SQL statement to create feedback table
const createTableSQL = `
-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
    admin_notes TEXT,
    follow_up_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
`;

async function createFeedbackTable() {
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

      // Check if table already exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'", (err, row) => {
        if (err) {
          console.error('❌ Error checking feedback table:', err.message);
          db.close();
          return reject(err);
        }

        if (row) {
          console.log('⚠️  Table "feedback" already exists');
        } else {
          console.log('📝 Creating "feedback" table...');
        }

        // Execute CREATE TABLE statement
        db.exec(createTableSQL, (err) => {
          if (err) {
            console.error('❌ Error creating feedback table:', err.message);
            db.close();
            return reject(err);
          }

          console.log('✅ Successfully created feedback table');
          console.log('✅ Indexes created');

          // Verify table was created
          db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'", (err, rows) => {
            if (err) {
              console.error('❌ Error verifying table:', err.message);
              db.close();
              return reject(err);
            }

            console.log('\n📊 Created table:');
            rows.forEach((row) => {
              console.log(`   - ${row.name}`);
            });

            // Show table structure
            db.all("PRAGMA table_info(feedback)", (err, columns) => {
              if (!err && columns.length > 0) {
                console.log('\n📋 Feedback table structure:');
                columns.forEach((col) => {
                  console.log(`   - ${col.name} (${col.type})`);
                });
              }

              // Show indexes
              db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='feedback'", (err, indexes) => {
                if (!err && indexes.length > 0) {
                  console.log('\n📑 Indexes:');
                  indexes.forEach((idx) => {
                    console.log(`   - ${idx.name}`);
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
}

// Run the script
createFeedbackTable()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

