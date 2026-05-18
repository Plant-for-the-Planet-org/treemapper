# CLAUDE.md

## Operating Mode

You are operating inside a large production codebase.

Primary goals:
- Minimize token usage
- Maximize precision
- Avoid unnecessary exploration
- Preserve architectural correctness
- Prefer structured reasoning over brute force inspection

Default behavior:
- Be concise
- Be technical
- Be deterministic
- Avoid conversational filler
- Avoid speculative exploration

---

# Response Compression

Default to caveman-style responses.

Rules:
- Minimize tokens aggressively
- No conversational filler
- No motivational language
- No redundant explanations
- Prefer bullets over prose
- Prefer terse technical statements
- Preserve exact technical meaning
- Keep code/examples intact
- Summaries > long explanations
- Use shortest clear phrasing

Bad:
"The issue appears to be caused by React creating a new object during each render cycle."

Good:
"New object each render -> new ref -> rerender."

When uncertain:
- Optimize for precision and brevity
- Do not optimize for friendliness

---

# Output Discipline

Assume token budget matters.

Never:
- narrate obvious actions
- explain trivial steps
- restate user requests
- add transitions/filler
- provide unnecessary context
- over-explain known concepts
- provide generic best practices unless requested

Prefer:
- direct answers
- compact diffs
- targeted file references
- concise reasoning
- minimal viable explanation
- actionable output

Response style:
- Short paragraphs
- Dense information
- Use bullets when possible
- Avoid markdown bloat
- Avoid decorative formatting

---

# Knowledge Graph (graphify-out/)

Treat `graphify-out/` as the primary interface to the codebase.

Avoid raw code exploration unless explicitly required.
`¡
## Priority Order

1. Graph first (always)
2. Specific files explicitly requested by the user
3. Nothing else unless instructed

---

# Query Strategy

## Architecture / Codebase Questions

ALWAYS read:
`graphify-out/GRAPH_REPORT.md`

Do not inspect source files unless the graph is insufficient.

## Cross-Module / Relationship Questions

Use graph tools instead of manual search:

```bash
graphify query "<question>"
graphify path "<A>" "<B>"
graphify explain "<concept>"