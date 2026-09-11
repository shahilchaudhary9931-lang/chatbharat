REVOKE ALL ON FUNCTION public.find_profile_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_profile_by_email(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_profile_by_email(text) TO service_role;