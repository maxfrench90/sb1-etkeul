/*
  # Create monitoring tables

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `operation` (text)
      - `error` (text)
      - `severity` (text)
      - `timestamp` (timestamptz)
      - `retry_count` (integer)
      - `user_id` (uuid)
      - `context` (jsonb)
    
    - `success_logs`
      - `id` (uuid, primary key)
      - `operation` (text)
      - `attempts` (integer)
      - `duration` (integer)
      - `context` (jsonb)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.success_logs CASCADE;

-- Create error_logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  error text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  retry_count integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  context jsonb
);

-- Create success_logs table
CREATE TABLE public.success_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  duration integer NOT NULL,
  context jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for error_logs
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for success_logs
CREATE POLICY "Authenticated users can insert success logs"
  ON public.success_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view success logs"
  ON public.success_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes after tables exist
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp 
  ON public.error_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_operation 
  ON public.error_logs(operation);

CREATE INDEX IF NOT EXISTS idx_success_logs_timestamp 
  ON public.success_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_success_logs_operation 
  ON public.success_logs(operation);

-- Add comments for documentation
COMMENT ON TABLE public.error_logs IS 'Stores application error logs with severity and context';
COMMENT ON TABLE public.success_logs IS 'Stores successful operation logs with performance metrics';