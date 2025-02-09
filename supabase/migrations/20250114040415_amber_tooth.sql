/*
  # Add additional features

  1. New Tables
    - `availability` - Store provider availability slots
    - `bookings` - Store service bookings
    - `payments` - Store payment information
  
  2. Updates
    - Add verification fields to profiles
    - Add payment fields to transactions
  
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add verification fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS verification_token_expires timestamptz;

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) NOT NULL,
  provider_id uuid REFERENCES profiles(id) NOT NULL,
  service_type text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  amount decimal NOT NULL,
  currency text DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add payment fields to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS stripe_transaction_id text;

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Availability policies
CREATE POLICY "Providers can manage their availability"
  ON availability
  FOR ALL
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can view provider availability"
  ON availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Booking policies
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id OR
    auth.uid() = provider_id
  );

CREATE POLICY "Clients can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Payment policies
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND (bookings.client_id = auth.uid() OR bookings.provider_id = auth.uid())
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_provider_time 
  ON availability (provider_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_bookings_client 
  ON bookings (client_id, start_time);

CREATE INDEX IF NOT EXISTS idx_bookings_provider 
  ON bookings (provider_id, start_time);

CREATE INDEX IF NOT EXISTS idx_payments_booking 
  ON payments (booking_id);