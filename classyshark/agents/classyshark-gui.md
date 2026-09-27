---
name: classyshark-gui
description: GUI control mode — agent drives the live ClassyShark Swing window while humans can still use it normally. Supports synchronous open/navigate/search with built-in wait, and reading what the GUI currently shows.
---

# ClassyShark GUI Control Agent

Controls the live ClassyShark GUI window via Agent commands over stdin.  
Humans can continue using the GUI — agent commands are dispatched via Swing EDT and never block human interaction.

## Launch

```bash
java -jar ClassyShark.jar -agent-gui-stdio [optional-archive-path]
```

## Protocol

Single JSON line per message over stdio (same as headless mode). All `gui.*` commands require `-agent-gui-stdio`.

---

## Commands

### State reading (read-only, always safe)
| Command | Params | Returns |
|---------|--------|---------|
| `gui.status` | — | Full GUI state snapshot |
| `gui.get_display_content` | — | `{displayMode, currentClass, displayContent}` |
| `gui.get_class_list` | opt: `query`, `offset`, `limit` | Pageable list of classes in loaded archive |
| `gui.get_filtered_classes` | — | Current search results + `searchText` |
| `gui.capture` | — | `{mime:"image/png", encoding:"base64", image:"..."}` — PNG of the currently visible right panel |

### Asynchronous control (fire-and-forget, return immediately)
| Command | Params | Effect |
|---------|--------|--------|
| `gui.open_archive` | `path` | Opens archive in GUI |
| `gui.navigate_to` | `className` | Navigate GUI to that class |
| `gui.search` | `query` | Type search text, filter class list |
| `gui.go_back` | — | Show full class list |
| `gui.view_top_class` | — | Open top autocomplete result |
| `gui.export` | — | Export current class + archive to files; returns `{outputDir, files}` |
| `gui.load_mappings` | `path` | Load ProGuard mapping file |
| `gui.toggle_tree` | `visible` (bool) | Show/hide left class tree |
| `gui.set_tab` | `tab` (`classes`\|`methods_count`) | Switch right-hand view between Classes and Methods count |

### Synchronous (block until done or timeout)
| Command | Params | Returns |
|---------|--------|---------|
| `gui.open_and_wait` | `path`, opt: `timeoutMs` (default 15000) | `{archiveLoaded, classCount, timedOut}` — opens archive AND waits for load |
| `gui.wait_for_load` | opt: `timeoutMs` (default 10000) | `{archiveLoaded, classCount, timedOut}` — waits for current open to finish |
| `gui.navigate_and_read` | `className`, opt: `timeoutMs` (default 5000) | `{displayMode, content, timedOut}` — navigates AND returns class content |
| `gui.search_and_wait` | `query`, opt: `timeoutMs` (default 5000) | `{items, total, query, timedOut}` — searches AND returns result list |

---

## `gui.status` response fields
```json
{
  "guiActive": true,
  "archiveLoaded": true,
  "archivePath": "/path/app.apk",
  "currentClass": "com.example.MainActivity",
  "searchText": "",
  "displayMode": "INSIDE_CLASS",
  "activeTab": "classes",
  "leftPanelVisible": true,
  "classCount": 2345,
  "humanRecentlyActive": false,
  "secondsSinceHumanInput": 42
}
```

**displayMode values:** `IDLE` | `CLASS_LIST` | `INSIDE_CLASS` | `SEARCH_RESULTS` | `ERROR`

---

## Human/Agent co-existence rules

1. Check `humanRecentlyActive` before issuing disruptive commands (`open_archive`, `navigate_to`).
2. If `secondsSinceHumanInput < 5`, wait and retry — the human is actively using the GUI.
3. Prefer synchronous commands (`open_and_wait`, `navigate_and_read`, `search_and_wait`) — they block only the agent thread, never the EDT.
4. Read-only commands (`gui.status`, `gui.get_display_content`, `gui.capture`, etc.) are always safe.

---

## Typical workflows

### Open APK and explore — simple synchronous style (recommended)
```json
// 1. Verify human is idle
{"command": "gui.status", "params": {}}
// → humanRecentlyActive == false → proceed

// 2. Open archive and wait (atomic, no polling needed)
{"command": "gui.open_and_wait", "params": {"path": "/path/app.apk", "timeoutMs": 20000}}
// → {"archiveLoaded": true, "classCount": 2345}

// 3. List classes
{"command": "gui.get_class_list", "params": {"query": "Activity", "limit": 20}}

// 4. Read a class synchronously
{"command": "gui.navigate_and_read", "params": {"className": "com.example.MainActivity"}}
// → {"displayMode": "INSIDE_CLASS", "content": "public class MainActivity...", "timedOut": false}
```

### Search → pick → read
```json
{"command": "gui.search_and_wait", "params": {"query": "Crypto", "timeoutMs": 5000}}
// → {"items": ["com.example.CryptoUtil", ...], "total": 3}

{"command": "gui.navigate_and_read", "params": {"className": "com.example.CryptoUtil"}}
// → {"content": "public class CryptoUtil {...}", "displayMode": "INSIDE_CLASS"}
```

### Async open + manual poll (legacy style, avoid when possible)
```json
{"command": "gui.open_archive", "params": {"path": "/path/app.apk"}}
// → {"status": "loading"}

// Poll until loaded:
{"command": "gui.status", "params": {}}
// repeat until archiveLoaded == true
```

### Security audit via GUI
```json
{"command": "gui.open_and_wait", "params": {"path": "/path/app.apk"}}
{"command": "gui.search_and_wait", "params": {"query": "Native", "timeoutMs": 3000}}
{"command": "gui.navigate_and_read", "params": {"className": "com.example.NativeHelper"}}
{"command": "gui.get_display_content", "params": {}}
```

---

## Notes

- `gui.open_and_wait` is the **preferred** way to open an archive — it's atomic and eliminates polling.
- `gui.navigate_and_read` and `gui.search_and_wait` use `CountDownLatch` internally — they block only the agent thread, never the Swing EDT.
- `displayContent` contains the full decompiled/translated text currently shown in the right panel.
- When `displayMode == CLASS_LIST`, the class list is available via `gui.get_class_list`.
- When `displayMode == SEARCH_RESULTS`, the result set is available via `gui.get_filtered_classes`.
- When `displayMode == ERROR`, the archive failed to load or the class doesn't exist.
- `gui.capture` may return `gui_not_visible` when the right-hand component has no renderable size; retry after the window is realized or after a synchronous navigation completes.
