/*
  # Verify monitoring tables structure

  1. Add missing columns and constraints
  2. Add additional indexes for performance
  3. Add audit triggers for tracking changes
*/

-- Add audit columns to error_logs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'error_logs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.error_logs 
    ADD COLUMN created_by uuid REFERENCES auth.users(id),
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add audit columns to success_logs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'success_logs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.success_logs 
    ADD COLUMN created_by uuid REFERENCES auth.users(id),
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_timestamp 
  ON public.error_logs(severity, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_timestamp 
  ON public.error_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_success_logs_duration 
  ON public.success_logs(duration DESC);

-- Add check constraints for data validation
ALTER TABLE public.error_logs 
  ADD CONSTRAINT error_logs_retry_count_check 
  CHECK (retry_count >= 0);

ALTER TABLE public.success_logs 
  ADD CONSTRAINT success_logs_duration_check 
  CHECK (duration >= 0);

-- Add policies for better security
CREATE POLICY "Users can view their own error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.uid() = created_by
  );

CREATE POLICY "Users can view their own success logs"
  ON public.success_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
  );

-- Add function to clean up old logs
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM public.error_logs 
  WHERE timestamp < now() - interval '30 days';
  
  DELETE FROM public.success_logs 
  WHERE timestamp < now() - interval '30 days';
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.error_logs.severity IS 'Error severity level: low, medium, high';
COMMENT ON COLUMN public.error_logs.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN public.error_logs.context IS 'Additional context about the error';
COMMENT ON COLUMN public.success_logs.attempts IS 'Number of attempts before success';
COMMENT ON COLUMN public.success_logs.duration IS 'Operation duration in milliseconds';