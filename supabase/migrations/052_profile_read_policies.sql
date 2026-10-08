-- ============================================================
-- 052_profile_read_policies.sql
--
-- Closes the half of the PII exposure that 051 deliberately left open:
-- an authenticated user could still read any professional's phone from
-- `profiles`, because several permissive SELECT policies grant blanket
-- read access.
--
-- Why a defensive drop instead of named DROPs
-- -------------------------------------------
-- The migration history contradicts itself. 009 and 010 define
-- `profiles_professionals_public`; the Lovable-era file
-- 20260311222051_*.sql defines "Professional profiles viewable by
-- everyone" on `profiles` and `FOR SELECT USING (true)` on
-- `professional_profiles`. That file sorts AFTER 043 lexicographically
-- ("2" > "0"), so on a fresh database it runs last and its blanket
-- policies win. 043 also records at least one change applied straight to
-- production, so the live policy set cannot be derived from this
-- directory with confidence.
--
-- Permissive policies are OR'ed. Dropping only the names we know about
-- would leave any unknown blanket policy in place and the exposure open.
-- So this drops every SELECT policy on both tables by enumerating
-- pg_policies, logging each one, and then creates exactly the intended
-- set. INSERT/UPDATE/DELETE policies are not touched.
--
-- Public read access is not lost: it moved to
-- public_professional_directory (051) and public_professional_reviews
-- (below), which are owner-run projections with safe column lists.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Indexes the new policies depend on
--
-- The counterparty policy runs EXISTS against `messages` for each
-- profiles row. messages had no index on either participant column, so
-- without these every profile read becomes a sequential scan.
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);

-- ------------------------------------------------------------
-- 2. Clean slate for SELECT
-- ------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'professional_profiles')
      AND cmd = 'SELECT'
  LOOP
    RAISE NOTICE 'dropping SELECT policy %.% -> %', 'public', r.tablename, r.policyname;
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 3. profiles — own, admin, or a real counterparty
--
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it
-- once per statement instead of once per row.
-- ------------------------------------------------------------

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Both parties to a service request can see each other. Used by the
-- service-completion flow, where a professional lists the clients of
-- their accepted/scheduled requests.
CREATE POLICY "profiles_select_service_counterparty"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE (sr.client_id = (SELECT auth.uid()) AND sr.professional_id = profiles.user_id)
         OR (sr.professional_id = (SELECT auth.uid()) AND sr.client_id = profiles.user_id)
    )
  );

-- Anyone you have actually exchanged a message with. Messaging can start
-- before a service_request exists, so the previous policy is not enough
-- on its own.
CREATE POLICY "profiles_select_message_counterparty"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE (m.sender_id = (SELECT auth.uid()) AND m.receiver_id = profiles.user_id)
         OR (m.receiver_id = (SELECT auth.uid()) AND m.sender_id = profiles.user_id)
    )
  );

-- ------------------------------------------------------------
-- 4. professional_profiles — own and admin only
--
-- Everything public about a professional is served by
-- public_professional_directory, which excludes phone, cnpj and precise
-- coordinates. Nothing in the app reads this table for another user
-- any more.
-- ------------------------------------------------------------

CREATE POLICY "professional_profiles_select_own"
  ON public.professional_profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "professional_profiles_select_admin"
  ON public.professional_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- 5. Reviews with their author's display name
--
-- A professional's public page shows reviews with the reviewer's name,
-- which it used to get with an embedded join into `profiles`. That join
-- stops resolving once the policies above apply, so the pairing moves
-- into an owner-run view.
--
-- client_id is deliberately NOT exposed: the page needs a display name,
-- not a way to correlate a review back to a user id.
--
-- No rating filter, which matches live behaviour. Note that `reviews`
-- carries two contradictory SELECT policies: 010 publishes only
-- `rating >= 3` to non-owners, while the Lovable-era file publishes
-- everything with USING (true). Permissive policies are OR'ed and the
-- second one sorts later, so today every review is public and the 010
-- filter has never taken effect. This view reproduces what is live
-- rather than silently changing it; which of the two is intended is a
-- product decision.
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public.public_professional_reviews AS
  SELECT
    r.id,
    r.professional_id,
    r.rating,
    r.comment,
    r.created_at,
    pr.full_name AS client_name
  FROM public.reviews r
  LEFT JOIN public.profiles pr ON pr.user_id = r.client_id;

REVOKE ALL ON public.public_professional_reviews FROM PUBLIC;
GRANT SELECT ON public.public_professional_reviews TO anon, authenticated;

COMMENT ON VIEW public.public_professional_reviews IS
  'Reviews for a professional plus the reviewer display name. Excludes client_id. Use this instead of embedding profiles into a reviews query.';
