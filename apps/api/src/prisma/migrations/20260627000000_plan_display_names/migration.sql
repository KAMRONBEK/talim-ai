-- Rename plan display names to the customer-facing Free / Pro / Team / School
-- (Tenant Starter -> Team, Tenant Growth -> School). Plan CODES are unchanged —
-- only the human-readable Plan.name. This keeps prod's Plan.name in sync with the
-- web app and admin labels without a manual SQL step. Idempotent and guarded so it
-- is a no-op on a DB that already has the new names.

UPDATE "Plan" SET "name" = 'Free'   WHERE "code" = 'FREE'           AND "name" <> 'Free';
UPDATE "Plan" SET "name" = 'Pro'    WHERE "code" = 'INDIVIDUAL_PRO' AND "name" <> 'Pro';
UPDATE "Plan" SET "name" = 'Team'   WHERE "code" = 'TENANT_STARTER' AND "name" <> 'Team';
UPDATE "Plan" SET "name" = 'School' WHERE "code" = 'TENANT_GROWTH'  AND "name" <> 'School';
