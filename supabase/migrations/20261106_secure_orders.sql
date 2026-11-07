-- Migration: Add idempotency_key and order rate limiting / security support to orders table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/fviuqehmohsljcenygeu/sql

-- 1. Add idempotency_key column with UNIQUE constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE orders ADD COLUMN idempotency_key text;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- 2. Add client_identifier_hash and order_hash columns for tamper detection & auditing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'client_identifier_hash'
    ) THEN
        ALTER TABLE orders ADD COLUMN client_identifier_hash text;
        CREATE INDEX IF NOT EXISTS idx_orders_client_hash ON orders(client_identifier_hash, created_at DESC);
    END IF;
END $$;

-- 3. Row Level Security (RLS) Policies on 'orders'
-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (Admins) full access
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
CREATE POLICY "Admins have full access to orders"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service_role full access (used by serverless API endpoints)
DROP POLICY IF EXISTS "Service role has full access to orders" ON orders;
CREATE POLICY "Service role has full access to orders"
ON orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Drop direct public INSERT access for anon once the serverless /api/order endpoint is active
-- To prevent direct PostgREST spoofing:
DROP POLICY IF EXISTS "Enable insert for anon users" ON orders;
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;

-- Prevent anon from viewing, updating or deleting orders
DROP POLICY IF EXISTS "Allow anon read orders" ON orders;
DROP POLICY IF EXISTS "Public read orders" ON orders;
