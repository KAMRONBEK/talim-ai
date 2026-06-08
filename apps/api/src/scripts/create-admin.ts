import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

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
  const { email, password, name } = parseArgs(argv);

  if (!email || !password) {
    console.error(
      'Usage: create-admin --email <email> --password <password> [--name <name>]',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', passwordHash, ...(name ? { name } : {}) },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name ?? null,
          role: 'ADMIN',
        },
      });

  console.log(
    existing
      ? `Updated existing user ${user.email} to ADMIN (${user.id})`
      : `Created ADMIN user ${user.email} (${user.id})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
