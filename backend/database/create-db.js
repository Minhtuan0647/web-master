const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, 'rare_parfume.db');
const db = new sqlite3.Database(dbPath);

// Read schema file
const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema
db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating database:', err);
  } else {
    console.log('Database created successfully!');
  }
});

// Read sample data
const sampleDataPath = path.join(__dirname, 'sample-data.sqlite.sql');
const sampleData = fs.readFileSync(sampleDataPath, 'utf8');

// Execute sample data
db.exec(sampleData, (err) => {
  if (err) {
    console.error('Error inserting sample data:', err);
  } else {
    console.log('Sample data inserted successfully!');
  }
  db.close();
});
