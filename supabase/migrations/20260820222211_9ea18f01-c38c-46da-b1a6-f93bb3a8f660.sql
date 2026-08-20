REVOKE ALL ON FUNCTION public.find_profile_by_email(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_profile_by_email(text) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;