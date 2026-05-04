## Knowledge Graph (graphify-out/)

Treat `graphify-out/` as the primary interface to the codebase. Avoid raw code exploration unless explicitly required.

### Priority Order
1. Graph first (always)
2. Specific files explicitly requested by the user
3. Nothing else unless instructed

### Query Strategy

**Architecture / Codebase Questions**
- ALWAYS read `graphify-out/GRAPH_REPORT.md` first
- Do not inspect source files unless the graph is insufficient

**Cross-Module / Relationship Questions**
Use graph tools instead of manual search:
```
graphify query "<question>"
graphify path "<A>" "<B>"
graphify explain "<concept>"
```
Do NOT use `grep`, `find`, or broad file scanning for these.

### File Access Rules
- Only read files explicitly mentioned by the user
- Do NOT traverse directories, open related files "just in case", or explore parent/sibling modules

**Allowed shortcuts:**
- Schema → `apps/server/src/database/schema/index.ts`
- Feature modules → `apps/server/src/<feature-name>/`

### Code Exploration Constraints

Strictly forbidden unless explicitly requested:
- Broad `find` or `grep` across `apps/`
- Opening multiple files to "understand context"
- Reconstructing architecture manually when graph exists

### After Code Changes

Always run `graphify update .` (AST-only, no API cost).

### Token Efficiency
- Read the minimum number of files required
- Prefer targeted reads with `offset`/`limit`
- Do not re-read files already in context
- Summarize findings clearly; do NOT dump raw file contents unless asked
- Highlight only relevant code snippets

### Failure Handling

If the graph is missing, outdated, or insufficient:
- State the limitation clearly
- Ask for permission before exploring the codebase directly

### Behavioral Defaults
- Be precise, not exploratory
- Minimize token usage
- Prefer structured reasoning over brute-force searching
- Ask before expanding scope
