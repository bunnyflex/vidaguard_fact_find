import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Import schema from shared directory
import * as schema from '@shared/schema';

// When DATABASE_URL is set, use it for Supabase connection
// Otherwise, fall back to in-memory storage for development
const getDatabaseClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Create a SQL executor
    const sql = neon(databaseUrl);
    
    // Create drizzle client with our schema
    return drizzle(sql, { schema });
  }
  
  // Return null when no connection string is available
  // The application will use MemStorage as a fallback
  return null;
};

export const db = getDatabaseClient();

export default db;