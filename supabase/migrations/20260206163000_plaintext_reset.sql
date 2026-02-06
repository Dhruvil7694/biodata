-- Reset admin password to plaintext 'admin123'
-- The Edge Function will detect this, hash it securely, and update the record on first login.

UPDATE public.admin_settings
SET password_hash = 'admin123',
    updated_at = now();
