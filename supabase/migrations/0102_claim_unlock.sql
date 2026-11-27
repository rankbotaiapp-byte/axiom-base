-- Safe additive columns & claim tracking for the $1 one-time unlock -> Studio -> Plan gate at Publish.

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS unlock_status text NOT NULL DEFAULT 'locked',
  ADD COLUMN IF NOT EXISTS unlocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS unlock_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS source_lead_id text;

-- Keep legacy/existing published shops consistent if a published flag/column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name = 'is_published'
  ) THEN
    UPDATE public.tenants
    SET publish_status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
    WHERE publish_status = 'draft' AND is_published = true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_unlock_status ON public.tenants (unlock_status);
CREATE INDEX IF NOT EXISTS idx_tenants_publish_status ON public.tenants (publish_status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_status ON public.tenants (plan_status);

CREATE TABLE IF NOT EXISTS public.claim_unlock_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  shop_slug text NOT NULL,
  niche_key text NOT NULL,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending', -- pending | unlocked | failed
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  unlocked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_claim_unlock_sessions_lead_id
  ON public.claim_unlock_sessions (lead_id);

ALTER TABLE public.claim_unlock_sessions ENABLE ROW LEVEL SECURITY;

-- Service role / server routes manage claim sessions; authenticated owners can view their own unlocked tenant's sessions
DROP POLICY IF EXISTS "Tenants can view own claim unlock sessions" ON public.claim_unlock_sessions;
CREATE POLICY "Tenants can view own claim unlock sessions"
  ON public.claim_unlock_sessions
  FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenants t
      WHERE t.id = claim_unlock_sessions.tenant_id
        AND (t.owner_user_id = auth.uid() OR t.user_id = auth.uid())
    )
  );
