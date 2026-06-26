
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_estate_id(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_estate_staff(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_estate_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_estate_staff(UUID, UUID) TO authenticated;
