@echo off
REM Database setup script for Rare Parfume (Windows)
REM This script creates the database and runs migrations

echo 🚀 Setting up Rare Parfume Database...

REM Database configuration
set DB_NAME=rare_parfume
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo 📊 Creating database: %DB_NAME%

REM Create database
createdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME% 2>nul || echo Database %DB_NAME% already exists

echo 📋 Running database schema...

REM Run schema
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database/schema.sql

echo 🌱 Inserting sample data...

REM Insert sample data
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database/sample-data.sql

echo ✅ Database setup completed successfully!
echo.
echo 📝 Database Information:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo.
echo 🔑 Admin Credentials:
echo    Email: admin@rareparfume.com
echo    Password: admin123
echo.
echo 🚀 You can now start the backend server with: npm run dev

pause
