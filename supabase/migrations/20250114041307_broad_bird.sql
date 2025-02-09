-- Create provider profiles table if not exists
CREATE TABLE IF NOT EXISTS provider_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  police_check_verified boolean DEFAULT false,
  police_check_file text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'provider_profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'provider_profiles' 
    AND policyname = 'Users can read own provider profile'
  ) THEN
    CREATE POLICY "Users can read own provider profile"
      ON provider_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'provider_profiles' 
    AND policyname = 'Users can update own provider profile'
  ) THEN
    CREATE POLICY "Users can update own provider profile"
      ON provider_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket if not exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('police-checks', 'police-checks', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload their own police checks'
  ) THEN
    CREATE POLICY "Users can upload their own police checks"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'police-checks' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;