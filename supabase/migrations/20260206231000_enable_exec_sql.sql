
-- Enable raw SQL execution for emergency bypasses
-- Only callable by service_role
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator (admin) privileges
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Revoke all permissions from public/anon
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM public;
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM authenticated;

-- Grant to service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
