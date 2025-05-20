/**
 * Initialize Database Script
 * 
 * This script sets up the database schema and seeds it with initial data.
 * Run this once when setting up a new Supabase instance.
 * 
 * Usage: node scripts/initialize-database.js
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set in your .env file');
  console.error('Please add your Supabase connection string to the .env file');
  process.exit(1);
}

// Create SQL client
const sql = neon(process.env.DATABASE_URL);

async function runSqlFile(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split on semicolons but keep them in the result (positive lookbehind)
    const statements = sqlContent.split(/(?<=;)\s*/g).filter(stmt => stmt.trim() !== '');
    
    console.log(`Running SQL file: ${path.basename(filePath)}`);
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql(statement);
        } catch (err) {
          console.error(`Error executing statement: ${statement.slice(0, 100)}...`);
          console.error(err);
          // Continue with next statement despite errors
        }
      }
    }
    
    console.log(`Completed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error running SQL file ${filePath}:`, error);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Run schema first
    await runSqlFile(path.join(__dirname, '..', 'migrations', 'initial_schema.sql'));
    
    // Then seed data
    await runSqlFile(path.join(__dirname, '..', 'migrations', 'seed_data.sql'));
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();