-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor (one time)
-- Required for: payment submission from Vue client
-- =============================================================

-- RPC: submit_payment_flip_pending()
-- Called by authenticated users after uploading a payment screenshot.
-- Flips their profile to 'pending' — bypasses protect_profile_sensitive_fields
-- trigger via SECURITY DEFINER, but only if a pending payment row exists.
CREATE OR REPLACE FUNCTION submit_payment_flip_pending()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Guard: only flip if there's actually a pending payment for this user
  IF NOT EXISTS (
    SELECT 1 FROM payments
    WHERE user_id = auth.uid() AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'no_pending_payment';
  END IF;

  UPDATE profiles
  SET subscription_status = 'pending'
  WHERE id = auth.uid()
    AND subscription_status IN ('inactive', 'denied', 'expired');
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_payment_flip_pending() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION submit_payment_flip_pending() TO authenticated;

-- =============================================================
-- Add vertical (9:16) video key columns
-- Run once. Safe to re-run (IF NOT EXISTS guard).
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_lessons' AND column_name = 'video_r2_key_vertical'
  ) THEN
    ALTER TABLE video_lessons ADD COLUMN video_r2_key_vertical TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collective_readings' AND column_name = 'video_r2_key_vertical'
  ) THEN
    ALTER TABLE collective_readings ADD COLUMN video_r2_key_vertical TEXT;
  END IF;
END $$;

-- =============================================================
-- test_results table + RLS
-- Run once. Safe to re-run (IF NOT EXISTS guards).
-- =============================================================
CREATE TABLE IF NOT EXISTS test_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id         UUID NOT NULL REFERENCES psychology_tests(id) ON DELETE CASCADE,
  answers         JSONB NOT NULL DEFAULT '{}',
  result_summary  TEXT,
  score           JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Users read their own results
DROP POLICY IF EXISTS "Users read own test_results" ON test_results;
CREATE POLICY "Users read own test_results"
  ON test_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert their own results
DROP POLICY IF EXISTS "Users insert own test_results" ON test_results;
CREATE POLICY "Users insert own test_results"
  ON test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins read all results
DROP POLICY IF EXISTS "Admins read all test_results" ON test_results;
CREATE POLICY "Admins read all test_results"
  ON test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =============================================================
-- psychology_tests RLS — authenticated users read published tests
-- Run once. Safe to re-run (DROP IF EXISTS).
-- =============================================================
ALTER TABLE psychology_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads published tests" ON psychology_tests;
CREATE POLICY "Anyone reads published tests"
  ON psychology_tests FOR SELECT
  USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins write psychology_tests" ON psychology_tests;
CREATE POLICY "Admins write psychology_tests"
  ON psychology_tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =============================================================
-- Helper functions required by community RLS
-- CREATE OR REPLACE is idempotent — safe to re-run.
-- =============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION is_active_subscriber()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (
          subscription_status = 'active'
          AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION is_active_subscriber() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION is_active_subscriber() TO authenticated;

-- =============================================================
-- community_posts table + indexes + RLS
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS guards).
-- =============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  image_path TEXT,
  is_hidden  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id    ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_hidden  ON community_posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts: active subscribers read non-hidden, admins read all" ON community_posts;
CREATE POLICY "community_posts: active subscribers read non-hidden, admins read all"
  ON community_posts FOR SELECT
  TO authenticated
  USING (
    (is_hidden = FALSE AND is_active_subscriber())
    OR is_admin()
  );

DROP POLICY IF EXISTS "community_posts: active subscribers insert own" ON community_posts;
CREATE POLICY "community_posts: active subscribers insert own"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_active_subscriber());

DROP POLICY IF EXISTS "community_posts: users update own, admins update any" ON community_posts;
CREATE POLICY "community_posts: users update own, admins update any"
  ON community_posts FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "community_posts: users delete own, admins delete any" ON community_posts;
CREATE POLICY "community_posts: users delete own, admins delete any"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- =============================================================
-- comments table + indexes + RLS
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS guards).
-- =============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  is_hidden  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id   ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_hidden ON comments(is_hidden);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments: active subscribers read non-hidden, admins read all" ON comments;
CREATE POLICY "comments: active subscribers read non-hidden, admins read all"
  ON comments FOR SELECT
  TO authenticated
  USING (
    (is_hidden = FALSE AND is_active_subscriber())
    OR is_admin()
  );

DROP POLICY IF EXISTS "comments: active subscribers insert own" ON comments;
CREATE POLICY "comments: active subscribers insert own"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_active_subscriber());

DROP POLICY IF EXISTS "comments: users update own, admins update any" ON comments;
CREATE POLICY "comments: users update own, admins update any"
  ON comments FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "comments: users delete own, admins delete any" ON comments;
CREATE POLICY "comments: users delete own, admins delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());
