-- Add observation_categories JSON column to challenge_types for admin-configurable categories
-- This allows admins to:
-- 1. Activate/deactivate specific observation categories per challenge
-- 2. Customize labels for each category

ALTER TABLE public.challenge_types
ADD COLUMN IF NOT EXISTS observation_categories JSONB DEFAULT '[]'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.challenge_types.observation_categories IS 'JSON array of category configs: [{"value": "cigarette_count", "label": "Napi cigaretta", "type": "numeric", "is_active": true}, ...]';

-- Update existing smoking challenge with default categories
UPDATE public.challenge_types
SET observation_categories = '[
  {"value": "cigarette_count", "label": "Napi cigaretta", "type": "numeric", "is_active": true},
  {"value": "craving_level", "label": "Sóvárgás mértéke", "type": "scale", "min": 1, "max": 10, "is_active": true},
  {"value": "mood", "label": "Hangulatom", "type": "scale", "min": 1, "max": 5, "is_active": true},
  {"value": "weight", "label": "Súly (kg)", "type": "numeric", "is_active": false},
  {"value": "energy", "label": "Energiaszintem", "type": "scale", "min": 1, "max": 5, "is_active": false},
  {"value": "sleep", "label": "Alvásom", "type": "scale", "min": 1, "max": 5, "is_active": false}
]'::jsonb
WHERE name ILIKE '%dohány%' OR name ILIKE '%smok%';