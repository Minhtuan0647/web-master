#!/bin/bash

# Database setup script for Rare Parfume
# This script creates the database and runs migrations

echo "🚀 Setting up Rare Parfume Database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Database configuration
DB_NAME="rare_parfume"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "📊 Creating database: $DB_NAME"

# Create database
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database $DB_NAME already exists"

echo "📋 Running database schema..."

# Run schema
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

echo "🌱 Inserting sample data..."

# Insert sample data
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/sample-data.sql

echo "✅ Database setup completed successfully!"
echo ""
echo "📝 Database Information:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: admin@rareparfume.com"
echo "   Password: admin123"
echo ""
echo "🚀 You can now start the backend server with: npm run dev"
