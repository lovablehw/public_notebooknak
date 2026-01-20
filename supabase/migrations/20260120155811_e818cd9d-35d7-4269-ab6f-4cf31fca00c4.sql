-- Add 'postmessage' to the url_target_type enum
ALTER TYPE public.url_target_type ADD VALUE IF NOT EXISTS 'postmessage';