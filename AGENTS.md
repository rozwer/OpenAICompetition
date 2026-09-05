<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project boundaries

- Read docs/spec/implementation-status.md and docs/team/reproduce.md first.
- Feature modules must not import other feature modules, server code, or infrastructure.
- Keep domain and contracts independent of UI, HTTP, database, and Codex implementations.
- Assemble dependencies in src/server and src/app only. Coordinate contract/schema changes before parallel work.
- Do not enable API billing, external accounts, generated-code execution, or data sharing as a substitute for unfinished integrations.
- Run pnpm check and pnpm build; use pnpm test:e2e for UI/API integration changes.
- Never present synthetic routes as walkable routes or unknown heights as observed building heights.
