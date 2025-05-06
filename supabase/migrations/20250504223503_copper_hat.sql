-- Create function to set admin metadata
CREATE OR REPLACE FUNCTION set_admin_metadata(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE id = user_id;

  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'
  )
  WHERE id = user_id;
END;
$$;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  target_id uuid REFERENCES auth.users(id),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs
CREATE POLICY "Only admins can read audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (action, actor_id, target_id, details)
  VALUES (action, auth.uid(), target_id, details);
END;
$$;

-- Create trigger function for user changes
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM log_admin_action(
      'delete_user',
      OLD.id,
      jsonb_build_object(
        'email', OLD.email,
        'role', OLD.role
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role != OLD.role THEN
      PERFORM log_admin_action(
        'promote_to_admin',
        NEW.id,
        jsonb_build_object(
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      );
    END IF;
    
    IF NEW.account_status != OLD.account_status THEN
      PERFORM log_admin_action(
        'update_user_status',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.account_status,
          'new_status', NEW.account_status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user changes
DROP TRIGGER IF EXISTS audit_user_changes_trigger ON users;
CREATE TRIGGER audit_user_changes_trigger
AFTER UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_user_changes();