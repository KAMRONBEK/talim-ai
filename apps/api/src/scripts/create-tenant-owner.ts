import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { createTenantForOwner } from '../services/tenant.service.js';
import { adminUpdateTenantSubscription } from '../services/subscription.service.js';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key?.startsWith('--')) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((arg) => arg !== '--');
  const { email, password, name, orgName, planCode } = parseArgs(argv);

  if (!email || !password || !orgName) {
    console.error(
      'Usage: create-tenant-owner --email <email> --password <password> --orgName <name> [--name <display>] [--planCode TENANT_STARTER]',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const tenantPlan = planCode ?? 'TENANT_STARTER';

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          role: 'TENANT_OWNER',
          passwordHash,
          adminPasswordNote: password,
          ...(name ? { name } : {}),
        },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          adminPasswordNote: password,
          name: name ?? null,
          role: 'TENANT_OWNER',
        },
      });

  let tenant = await prisma.tenant.findFirst({ where: { ownerId: user.id } });
  if (!tenant) {
    const { tenantId } = await createTenantForOwner(user.id, orgName);
    tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    console.log(`Created organization "${orgName}" (${tenant.id})`);
  } else if (orgName && tenant.name !== orgName) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { name: orgName },
    });
    console.log(`Updated organization name to "${orgName}"`);
  }

  const subscription = await adminUpdateTenantSubscription(tenant.id, {
    planCode: tenantPlan,
    status: 'ACTIVE',
  });

  console.log(
    existing
      ? `Updated tenant owner ${user.email} (${user.id})`
      : `Created tenant owner ${user.email} (${user.id})`,
  );
  console.log(`Organization: ${tenant.name} (${tenant.slug})`);
  console.log(`Subscription: ${subscription.planCode} (${subscription.status})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
