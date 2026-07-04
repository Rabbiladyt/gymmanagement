/*
# Laundry Application Database Schema

This migration creates a complete laundry management system:

1. **customers** - Pelanggan laundry
2. **services** - Jenis layanan laundry
3. **orders** - Pesanan laundry
4. **order_items** - Detail item dalam pesanan
5. **promos** - Promosi/diskon

Security: RLS enabled with anon + authenticated policies
*/

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  address text,
  notes text,
  total_orders integer DEFAULT 0,
  total_spent decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_customers" ON customers;
CREATE POLICY "anon_crud_customers" ON customers FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  estimated_hours integer DEFAULT 24,
  icon text DEFAULT 'shirt',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_services" ON services;
CREATE POLICY "anon_crud_services" ON services FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id),
  weight decimal(6,2) DEFAULT 0,
  quantity integer DEFAULT 1,
  notes text,
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  delivery_fee decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'washing', 'drying', 'ironing', 'ready', 'delivered', 'cancelled')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
  pickup_date date,
  pickup_time time,
  delivery_date date,
  delivery_time time,
  est_completion date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_orders" ON orders;
CREATE POLICY "anon_crud_orders" ON orders FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  price decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_order_items" ON order_items;
CREATE POLICY "anon_crud_order_items" ON order_items FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Promos table
CREATE TABLE IF NOT EXISTS promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discount_percent decimal(5,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  min_order decimal(10,2) DEFAULT 0,
  max_discount decimal(10,2),
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_promos" ON promos;
CREATE POLICY "anon_crud_promos" ON promos FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
