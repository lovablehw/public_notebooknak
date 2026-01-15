-- Seed initial admin user for self-hosted/GitHub deployments
-- This admin will be linked to their auth account when they register
INSERT INTO public.admin_users (email)
VALUES ('teszt@localhost.com')
ON CONFLICT DO NOTHING;