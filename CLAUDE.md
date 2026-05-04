## Knowledge Graph (graphify-out/)

Graph is at `graphify-out/`. Use it as the first source of truth — do NOT scan entire `apps/server`, `apps/web`, or `app` directories.

### Rules
- **Architecture / codebase questions** → read `graphify-out/GRAPH_REPORT.md` first
- **Cross-module questions** → use `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` instead of grep
- **After code edits** → run `graphify update .` (AST-only, no API cost)

### File Access
- Only read the specific file(s) the user names. Do not traverse parent dirs or related files unless asked.
- For the schema, go directly to `apps/server/src/database/schema/index.ts`
- For a feature module, go directly to its folder (e.g. `apps/server/src/approval-board/`)
- Never do broad `find` or `grep` scans across `apps/` without being asked

### Token-Saving Defaults
- Skip reading files you don't need to answer the question
- Prefer targeted `Read` with `offset`/`limit` over reading full large files
- Do not re-read files already shown in context this session
- Summarize findings in-line; do not dump raw file contents back to the user
