# auth

Validates sessions issued by the central auth service (auth.aboutselphy.com,
Discord login) by reading its Postgres tables directly (`session.ts`), plus
the role helpers (`roles.ts`) and the sign-out button. No auth instance or
accounts of its own. See [../README.md](../README.md) for cross-module import
rules.
