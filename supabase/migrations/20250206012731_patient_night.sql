/*
  # Add metrics table and indexes

  1. New Tables
    - `metrics`
      - `id` (uuid, primary key)
      - `type` (text) - Event type (realtime_event, retry, conflict, cache_operation)
      - `subtype` (text) - Specific event subtype
      - `success` (boolean) - Whether the operation succeeded
      - `duration` (integer) - Operation duration in milliseconds
      - `error` (text) - Error message if operation failed
      - `metadata` (jsonb) - Additional context about the event
      - `timestamp` (timestamptz) - When the event occurred
      - `created_at` (timestamptz) - When the record was created
      - `user_id` (uuid) - Reference to auth.users

  2. Security
    - Enable RLS on metrics table
    - Add policies for authenticated users
*/

-- Create metrics table
CREATE TABLE IF NOT EXISTS public.metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  subtype text,
  success boolean NOT NULL DEFAULT true,
  duration integer,
  error text,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own metrics"
  ON public.metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics"
  ON public.metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_metrics_type_timestamp 
  ON public.metrics(type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_user_timestamp 
  ON public.metrics(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_success 
  ON public.metrics(success);

-- Add function to clean up old metrics
CREATE OR REPLACE FUNCTION clean_old_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete metrics older than 30 days
  DELETE FROM public.metrics 
  WHERE timestamp < now() - interval '30 days';
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE public.metrics IS 'Stores application metrics and events';
COMMENT ON COLUMN public.metrics.type IS 'Type of metric event';
COMMENT ON COLUMN public.metrics.subtype IS 'Specific subtype of the event';
COMMENT ON COLUMN public.metrics.metadata IS 'Additional context about the event';