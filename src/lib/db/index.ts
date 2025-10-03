/**
 * Database Client Configuration
 * Drizzle ORM setup for PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string
const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

// Create PostgreSQL client
const client = postgres(connectionString);

// Create Drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
