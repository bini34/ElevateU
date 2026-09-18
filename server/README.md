# ElevateU API

Laravel / Passport / MySQL API with Reverb and a database queue. Follow the repository [development workflow](../docs/DEVELOPMENT.md) for environment provisioning, keys, migrations, Docker and isolated tests. Preserve existing `.env` files and databases; never use a database reset as a setup or upgrade shortcut.

PHPUnit must run in the documented network-disabled SQLite runtime, separate from the disposable HTTP/WebSocket Compose stack. The test entrypoint fails closed if the resolved database is not SQLite memory. Full Pint and Composer audit currently report unresolved findings.

See [architecture](../docs/ARCHITECTURE.md), [API contracts](../docs/API.md), [security decisions and legacy private-media rollout](../docs/SECURITY.md), and [dependency findings](../docs/DEPENDENCIES.md). OAuth routes are explicitly unavailable until their safe replacement is verified.
