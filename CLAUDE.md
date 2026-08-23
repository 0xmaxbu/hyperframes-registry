# hyperframes-registry

Our custom [HyperFrames](https://hyperframes.heygen.com) catalog — blocks and components we build so agents composing in HyperFrames automatically discover and reuse them. Based on the [catalog contributing conventions](https://hyperframes.heygen.com/contributing/catalog):

- **Blocks** — standalone compositions (fixed dimensions + duration) in `registry/blocks/`
- **Components** — snippets installed into other compositions in `registry/components/` (need an extra `demo.html`)
- Every item has a `registry-item.json` manifest; element IDs are prefixed with the item's abbreviation to avoid collisions when used as sub-compositions.
- Before exploring HyperFrames docs, fetch `https://hyperframes.heygen.com/llms.txt`.
- Build items with the `/hyperframes-registry` skill; validate with `bun run lint:registry-items <name>`, then `npx hyperframes init scratch && cd scratch && npx hyperframes add <name> && npx hyperframes check`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`0xmaxbu/hyperframes-registry`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the label string equals the role name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root, created lazily by `/domain-modeling`. See `docs/agents/domain.md`.
