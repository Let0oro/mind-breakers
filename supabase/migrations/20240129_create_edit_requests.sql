CREATE TABLE IF NOT EXISTS edit_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type text NOT NULL, -- 'course', 'path', 'organization'
  resource_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  data jsonb NOT NULL,
  reason text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS edit_requests_resource_idx ON edit_requests(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS edit_requests_status_idx ON edit_requests(status);
