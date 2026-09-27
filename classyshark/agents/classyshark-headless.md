---
name: classyshark-headless
description: Headless (no-GUI) analysis of APK/JAR/DEX/class binary archives via ClassyShark Agent JSON-over-stdio protocol
---

# ClassyShark Headless Agent

Analyzes Android/Java binary archives without a GUI. Launch ClassyShark with `-agent-stdio`.

## Launch

```bash
java -jar ClassyShark.jar -agent-stdio
```

## Protocol

Single-line JSON over stdio.
```json
{"command": "<name>", "params": {...}}
```

## Commands (29 total)

### Meta
- `agent.capabilities` — list all commands

### Archive analysis (APK/JAR/DEX/class/AAR/ELF)
- `archive.list_classes` — params: `path`, opt: `query`, `offset`, `limit`
- `archive.get_class` — params: `path`, `className` → decompiled source
- `archive.get_manifest` — params: `path` → AndroidManifest.xml (APK only)
- `archive.list_methods` — params: `path`, opt: `query`, `offset`, `limit`
- `archive.list_strings` — params: `path`, opt: `query`, `offset`, `limit`
- `archive.is_multidex` — params: `path` → `{multidex, customMultidex}`
- `archive.method_counts` — params: `path`, opt: `flat`
- `archive.inspect_apk` — params: `path` → APK structure summary
- `archive.export` — params: `path`, `outputDir` → writes files
- `archive.list_components` — params: `path` → native libs, dex, assets
- `archive.get_entry` — params: `path`, `entry` → raw content
- `archive.get_class_deps` — params: `path`, `className` → dependency list

### APK security (APK only)
- `apk.dashboard` — full DEX stats, native libs, java deps, manifest issues
- `apk.check_java_deps` — Java dependency warnings
- `apk.check_manifest` — Manifest issue list

## Pagination

`list_*` commands support `offset` + `limit`. Response: `{items, total, returned, truncated}`.
