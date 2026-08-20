ALTER TABLE public.profiles ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles (lower(email));

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users can view profiles they message with"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE (m.sender_id = auth.uid() AND m.receiver_id = profiles.id)
       OR (m.receiver_id = auth.uid() AND m.sender_id = profiles.id)
  ));

CREATE OR REPLACE FUNCTION public.find_profile_by_email(_email text)
RETURNS TABLE (id uuid, username text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.email
  FROM public.profiles p
  WHERE lower(p.email) = lower(trim(_email))
    AND p.id <> auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_profile_by_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.find_profile_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, split_part(coalesce(NEW.email, ''), '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();