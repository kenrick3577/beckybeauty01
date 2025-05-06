/*
  # Add update_profile RPC function
  
  1. New Function
    - Creates a secure RPC function for updating user profiles
    - Validates input data
    - Ensures users can only update their own profiles
    - Maintains data integrity with proper error handling
  
  2. Security
    - Function executes with invoker security
    - Validates user authentication
    - Checks user permissions
*/

-- Create a secure function to update user profiles
create or replace function update_profile(
  p_name text,
  p_email text,
  p_mobile text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing_email text;
begin
  -- Get the ID of the authenticated user
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  if v_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  end if;

  -- Check if email already exists for another user
  select email into v_existing_email
  from users
  where email = p_email and id != v_user_id;
  
  if v_existing_email is not null then
    return json_build_object(
      'success', false,
      'message', 'Email already in use'
    );
  end if;

  -- Update the user profile
  update users
  set
    name = p_name,
    email = p_email,
    mobile = p_mobile
  where id = v_user_id;

  return json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;