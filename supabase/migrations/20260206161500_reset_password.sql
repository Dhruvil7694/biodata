-- Update admin password to 'admin123' with valid bcryptjs hash
-- Generated using bcryptjs with cost 10
-- Hash: $2b$10$gXnGXVc58l4PhOkaziiWZ.NOIdrYuwPZGVZOpwEeE9O00AE5pt04XK

UPDATE public.admin_settings
SET password_hash = '$2b$10$gXnGXVc58l4PhOkaziiWZ.NOIdrYuwPZGVZOpwEeE9O00AE5pt04XK',
    updated_at = now();
