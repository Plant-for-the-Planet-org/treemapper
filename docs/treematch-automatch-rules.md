# TreeMatch auto-match: rule catalogue

Candidate rules for the auto-match rebuild, checked against the fields that
actually exist in the current schema and the TTC contract (2026-07-31).

A rule reads as one sentence:

> **WHEN** these donations → **PREFER** these locations → **ORDER BY** this
> donation order

Rules run top to bottom. Each takes what it can and passes the remainder down.
A locked catch-all always runs last.

---

## What the data allows

This decides the whole vocabulary, so it comes first.

### Donation side (TTC)

Two kinds of field, with very different costs.

**On the item.** Free to filter, already in hand:
`units`, `unitsAllocated`, `available`, `unitType`, `currency`,
`allocationPriority`, `ignored`, `donation.uid`, `donation.paymentDate`,
`donation.amount`.

**Query param only.** `profileType` and `country` are not returned per item, so
a rule using them needs its own full paged sweep of TTC. Those sweeps serialize
at roughly 700ms per page and do not overlap, they stack. Two such rules means
two sweeps.

`sortBy` supports `paymentDate` only. Any "largest first" ordering therefore
sorts what is loaded, never the whole project.

### Location side (intervention)

Available: `type`, `status`, `siteId` and `site.name`, `interventionStartDate`,
`interventionEndDate`, `registrationDate`, `location` (PostGIS), `area`,
`totalTreeCount`, `captureStatus`, `flag`, `reviewStatus`, `isPrivate`, plus
species through `intervention_species`.

---

## WHEN: which donations a rule takes

### Free (filter in memory)

| Condition | Why it earns its place |
| --- | --- |
| Any donation | The catch-all default |
| Donation size over / under N trees | Hold back large corporate donations for manual placement |
| Open amount over / under N | Skip dust, or target donations that are nearly done |
| Paid before / after a date | Clear the backlog first, leave this month alone |
| Paid more than N days ago | Same idea, but survives without editing |
| Match state is unmatched | Only start fresh donations |
| Match state is partly matched | Finish what is half done before starting new work |
| Unit type is `tree` or `m2` | Safety. An m² contribution should never eat tree counts |
| Currency is X | Weak alone, usable as a rough region proxy |
| A specific donation reference | The escape hatch for one awkward donation |

### Costs one extra TTC sweep each

Use two or three at most in a list.

| Condition | Note |
| --- | --- |
| Company donations | The most requested split. Worth the sweep |
| Individual donations | The other half of the same split |
| Donations from country XX | Fixed ISO-2 list, since TTC does not return country per item |

### Not possible, do not design for it

- Donor name, email, or any donor identity. ROs never see it and that will not change.
- Payout or disbursement state. There is no payouts API. This was already dropped once from the old mock.
- Campaign, gift or tribute, subscription or recurring flags.
- Anything the donor asked for (species, site, region).

---

## PREFER: which locations a rule fills

| Strategy | Effect |
| --- | --- |
| Oldest planting first | The old default. Sane and matches accounting order |
| Newest planting first | Close out recent field work |
| A specific site | The main reason people want rules at all |
| Most free capacity first | Fewest pairs written, fewest locations touched |
| Least free capacity first | Maximises fully closed locations, leaves clean edges |
| A specific intervention type | For example keep single-tree registrations for individual donors |
| Only approved and unflagged | Quality gate, using `reviewStatus` and `flag` |
| Largest / smallest by tree count | Blunt, but occasionally what an admin means by "the big sites" |
| By species | Possible through `intervention_species`, but needs a join and is niche |

A soft-deleted preferred site should make the rule match nothing and fall
through, not fail the run. The old planner did this and flagged it as
`siteMissing` in the summary.

---

## ORDER BY: donation order inside a rule

| Order | Honest at project scale? |
| --- | --- |
| Oldest paid first | Yes. The safe default, FIFO |
| Newest paid first | Yes |
| Largest open amount first | Only over loaded pages, see the `sortBy` limit |
| Smallest open amount first | Same limit. Useful to clear a long tail |

---

## Two rule kinds that did not exist before

Neither is a WHEN or a PREFER. They sit above the rule list.

### Exclusion rules ("never auto-match")

The old design's only hold-back signal was TTC's `allocationPriority = manual`,
applied as a global gate. That turned out to exclude everything (see Pitfalls),
so exclusion rules are now the hold-back mechanism, as intended here. They are
free to evaluate and are the guard rail people will want the first time a run
places a very large donation somewhere odd.

- Never auto-match donations over N trees
- Never auto-match this donation reference
- Never auto-match donations newer than N days
- Never auto-match donations whose priority is `manual` (the old gate, opt-in)

It also stops a bad habit: ignoring a donation purely to keep auto-match off it,
which misuses a flag that belongs to TTC and means something else.

### Per-run caps

- Match at most N trees per run
- Match at most N pairs per run
- Fill at most N percent of any one location

A bulk write of hundreds of pairs against a live TTC total is the riskiest part
of this feature.

---

## Suggested starter set

Enough to cover the real jobs without a big rule engine.

1. Company donations → prefer site "<flagship>" → oldest first
2. Donations over 500 trees → **never auto-match**
3. Partly matched donations → prefer least free capacity → oldest first
4. *Everything else* → oldest locations → oldest first (locked default)

That is: keep corporate money in the flagship site, keep big donations under
human control, finish half done work, sweep the rest.

---

## Pitfalls

- **Money conditions.** `donation.amount` is minor units in mixed currencies, so
  an "over 1000" rule silently compares euros to pesos. Prefer tree counts.
- **Too many query-param rules.** Each company, individual or country rule adds
  a serialized TTC sweep. Cost grows linearly with the count.
- **`allocationPriority`.** Do not rebuild it as a gate. It was one until
  2026-08-02 (an allowlist of `automatic` and `first`) and it excluded every
  contribution the backend serves, since they all come back `manual`, so no run
  could ever place anything. It is a WHEN condition now, and its value is not
  validated against the known set so a priority TTC adds later still works.
- **Double spending.** Consumption state must be shared across rules. A German
  company donation can be selected by both a company rule and a country rule.
- **Determinism.** Every sort needs a stable final tiebreak (id) or two runs on
  the same data disagree.
