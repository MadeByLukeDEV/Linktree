import "dotenv/config";
import { auth } from "@/modules/auth/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLE } from "@/modules/auth/roles";

async function main() {
  const email = process.env.OWNER_EMAIL ?? process.argv[2];
  const password = process.env.OWNER_PASSWORD ?? process.argv[3];
  const name = process.env.OWNER_NAME ?? process.argv[4] ?? "Admin";

  if (!email || !password) {
    console.error(
      "Usage: pnpm create-owner <email> <password> [name]\n" +
        "(or set OWNER_EMAIL / OWNER_PASSWORD / OWNER_NAME env vars)"
    );
    process.exit(1);
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: ADMIN_ROLE },
  });

  console.log(`Created owner account: ${email} (role: ${ADMIN_ROLE})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
