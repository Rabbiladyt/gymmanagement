/*
# Seed Data for Laundry Application

This migration adds sample data:
- Default laundry services
- Sample customers
- Sample promos
- Sample orders
*/

-- Default Services
INSERT INTO services (name, description, base_price, unit, estimated_hours, icon, is_active) VALUES
('Cuci Kering', 'Cuci pakaian biasa tanpa setrika', 7000, 'kg', 24, 'droplets', true),
('Cuci Setrika', 'Cuci dan setrika pakaian', 10000, 'kg', 48, 'shirt', true),
('Dry Clean', 'Pembersihan kering untuk pakaian premium', 25000, 'piece', 72, 'sparkles', true),
('Express 6 Jam', 'Layanan express 6 jam selesai', 18000, 'kg', 6, 'zap', true),
('Express 12 Jam', 'Layanan express 12 jam selesai', 15000, 'kg', 12, 'clock', true),
('Cuci Sepatu', 'Cuci sepatu sneakers dan kulit', 35000, 'pair', 48, 'footprints', true),
('Cuci Tas', 'Cuci tas dan ransel', 40000, 'piece', 48, 'shopping-bag', true),
('Cuci Sprei Set', 'Cuci sprei, sarung bantal, selimut', 10000, 'set', 24, 'bed', true),
('Cuci Boneka', 'Cuci boneka dan mainan plush', 25000, 'piece', 72, 'heart', true)
ON CONFLICT DO NOTHING;

-- Sample Customers
INSERT INTO customers (name, phone, email, address, notes) VALUES
('Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 10, Menteng', 'Pelanggan setia seit 2023'),
('Siti Rahayu', '081234567891', 'siti@email.com', 'Jl. Sudirman No. 25, Kuningan', 'Request parfum lavender'),
('Ahmad Wijaya', '081234567892', null, 'Jl. Gatot Subroto No. 5', 'Khusus dry clean'),
('Dewi Lestari', '081234567893', 'dewi@email.com', 'Jl. Thamrin No. 100', 'VIP customer'),
('Rudi Hermawan', '081234567894', null, 'Jl. Rasuna Said No. 50', 'Order rutin mingguan')
ON CONFLICT (phone) DO NOTHING;

-- Sample Promos
INSERT INTO promos (code, name, discount_percent, min_order, valid_from, valid_until, is_active) VALUES
('HEMAT20', 'Diskon 20% Order Pertama', 20, 50000, '2025-01-01', '2025-12-31', true),
('LAUNDRY10', 'Diskon 10% Setiap Hari', 10, 30000, '2025-01-01', '2025-12-31', true),
('EXPRESS5', 'Potongan 5rb Express', 0, 25000, '2025-01-01', '2025-12-31', true)
ON CONFLICT (code) DO NOTHING;

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  prefix text := 'LD';
  date_part text := to_char(CURRENT_DATE, 'YYMM');
  seq_num int;
  order_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 7 FOR 4) AS int)), 0) + 1
  INTO seq_num
  FROM orders
  WHERE order_number LIKE prefix || date_part || '%';
  
  order_num := prefix || date_part || lpad(seq_num::text, 4, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Sample Orders
DO $$
DECLARE
  budi_id uuid;
  siti_id uuid;
  ahmad_id uuid;
  cuci_setrika_id uuid;
  dry_clean_id uuid;
  express_id uuid;
BEGIN
  SELECT id INTO budi_id FROM customers WHERE phone = '081234567890';
  SELECT id INTO siti_id FROM customers WHERE phone = '081234567891';
  SELECT id INTO ahmad_id FROM customers WHERE phone = '081234567892';
  SELECT id INTO cuci_setrika_id FROM services WHERE name = 'Cuci Setrika';
  SELECT id INTO dry_clean_id FROM services WHERE name = 'Dry Clean';
  SELECT id INTO express_id FROM services WHERE name = 'Express 6 Jam';
  
  -- Insert sample orders
  INSERT INTO orders (order_number, customer_id, service_id, weight, subtotal, total, status, payment_status, pickup_date, est_completion)
  VALUES 
    (generate_order_number(), budi_id, cuci_setrika_id, 5.5, 55000, 55000, 'processing', 'paid', CURRENT_DATE - 1, CURRENT_DATE + 1),
    (generate_order_number(), siti_id, express_id, 3.0, 54000, 54000, 'washing', 'unpaid', CURRENT_DATE, CURRENT_DATE),
    (generate_order_number(), ahmad_id, dry_clean_id, 2, 50000, 50000, 'pending', 'unpaid', CURRENT_DATE + 1, CURRENT_DATE + 3)
  ON CONFLICT (order_number) DO NOTHING;
END $$;
