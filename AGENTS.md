# Agents

All agents are defined in `src/deep_agent/graph.py`.

## Conventions

- Prefer async-native code wherever possible for performance. Tools, tests, and any new I/O should use async.
- New tools should be low-dependency and safe to run on a remote server.
- This deploys in a web server. Avoid calls to actual file system.

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
