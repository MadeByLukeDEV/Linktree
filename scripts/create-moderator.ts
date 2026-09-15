import "dotenv/config";
import { auth } from "@/modules/auth/server";
import { prisma } from "@/lib/prisma";
import { MODERATOR_ROLE } from "@/modules/auth/roles";

async function main() {
  const email = process.env.MODERATOR_EMAIL ?? process.argv[2];
  const password = process.env.MODERATOR_PASSWORD ?? process.argv[3];
  const name = process.env.MODERATOR_NAME ?? process.argv[4] ?? "Moderator";

  if (!email || !password) {
    console.error(
      "Usage: pnpm create-moderator <email> <password> [name]\n" +
        "(or set MODERATOR_EMAIL / MODERATOR_PASSWORD / MODERATOR_NAME env vars)"
    );
    process.exit(1);
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: MODERATOR_ROLE },
  });

  console.log(`Created moderator account: ${email} (role: ${MODERATOR_ROLE})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
