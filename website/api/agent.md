# Agent API

ClassyShark exposes two complementary Agent API modes:

- **Headless mode**: archive analysis without creating a Swing window. It can run on a server without a display.
- **GUI mode**: controls a live Swing window through a JSON-over-stdio bridge. Human interaction remains available.

Both modes use one JSON request per line and one JSON response per line:

```json
{"command":"agent.capabilities","params":{}}
```

Successful responses contain `status: "ok"`; failures contain `status: "error"` and an error code.

## Headless mode

Start the protocol without opening the GUI:

```bash
java -jar ClassyShark.jar -agent-stdio
```

The `archive.*` and `apk.*` commands are pure analysis operations. They accept an archive path in `params.path` and do not require a GUI process or display server.

| Command | Purpose |
| --- | --- |
| `archive.list_classes` | List classes, with optional `query`, `offset`, and `limit` |
| `archive.get_class` | Translate one class (`className`) |
| `archive.get_manifest` | Read the APK manifest |
| `archive.list_methods` | List DEX methods |
| `archive.list_strings` | List DEX strings |
| `archive.is_multidex` | Detect standard and custom multidex |
| `archive.method_counts` | Export tree or flat method counts (`flat`) |
| `archive.inspect_apk` | Inspect APK structure |
| `archive.export` | Export analysis files to `outputDir` |
| `archive.list_components` | List archive components |
| `archive.get_entry` | Translate/read an archive entry (`entry`) |
| `archive.get_class_deps` | List dependencies of `className` |
| `apk.dashboard` | Return APK dashboard data |
| `apk.check_java_deps` | Return Java dependency warnings |
| `apk.check_manifest` | Return manifest recommendations/issues |

For embedding without stdio, `AgentCommandDispatcher.dispatch(String json)` exposes the same service in-process. The underlying `HeadlessAgentService` contains no Swing/AWT dependency.

## GUI mode

Start a GUI and the Agent bridge together:

```bash
java -jar ClassyShark.jar -agent-gui-stdio
```

GUI commands require an active GUI. Archive loading, navigation, and search are asynchronous by default; the `*_and_wait` variants are recommended when an Agent needs a deterministic result.

### Read-only state

| Command | Purpose |
| --- | --- |
| `gui.status` | Read GUI/archive/display state and human activity status |
| `gui.get_display_content` | Read current display mode, class, and translated content |
| `gui.get_class_list` | Read classes in the loaded archive, with pagination/filtering |
| `gui.get_filtered_classes` | Read the current search result list |
| `gui.capture` | Capture the visible right-hand GUI panel as a base64 PNG |
| `gui.status.activeTab` | Read which tab (`classes` or `methods_count`) is shown |

### Control

| Command | Purpose |
| --- | --- |
| `gui.open_archive` | Open an archive asynchronously |
| `gui.navigate_to` | Navigate to a class asynchronously |
| `gui.search` | Update the search field asynchronously |
| `gui.go_back` | Return to the class list |
| `gui.view_top_class` | Open the top autocomplete result |
| `gui.export` | Export the current GUI selection/archive |
| `gui.load_mappings` | Load a mapping file (`path`) |
| `gui.toggle_tree` | Show or hide the class tree (`visible`) |
| `gui.set_tab` | Switch the right-hand view to `classes` or `methods_count` |

### Deterministic control

| Command | Purpose |
| --- | --- |
| `gui.open_and_wait` | Open an archive and wait for loading (`timeoutMs`) |
| `gui.wait_for_load` | Wait for an already-started archive load |
| `gui.navigate_and_read` | Navigate and return translated display content |
| `gui.search_and_wait` | Search and return the resulting class list |

### Co-existence contract

- Agent commands are dispatched to the Swing event queue; the Agent protocol thread does not block the EDT.
- Before disruptive operations, inspect `gui.status.humanRecentlyActive`. If it is `true`, defer the operation; it means a human typed within the five-second activity window.
- Prefer read-only commands whenever possible.
- Use timeout parameters and handle `timedOut: true` rather than assuming a result is ready.
- GUI state is synchronized back from the panel after archive, navigation, search, back, and error transitions.

`gui.status` includes `displayMode` (`IDLE`, `CLASS_LIST`, `INSIDE_CLASS`, `SEARCH_RESULTS`, or `ERROR`), `activeTab` (`classes` or `methods_count`), `leftPanelVisible`, `archiveLoaded`, `classCount`, `currentClass`, and human activity fields. `gui.capture` returns `{mime: "image/png", encoding: "base64", image: "..."}` for the currently visible right-hand panel; it returns `gui_not_visible` when the component has no renderable size.

## Capability discovery

Use `agent.capabilities` at startup to discover the protocol version and available commands (current protocol is `classyshark-agent-v1`).

The advertised command list is mode-specific:
- **Headless mode** returns only the headless verbs (`agent.capabilities` plus `archive.*` and `apk.*`).
- **GUI mode** returns the full surface (headless + `gui.*`).

Calling a `gui.*` command in headless mode returns `error.code` `gui_not_available` with guidance to relaunch with `-agent-gui-stdio`.

## Architecture

The two modes are backed by two isolated services in `agent/`:

- `HeadlessAgentService` — the pure analysis service. It has **no GUI/Swing dependency**, so it can run on a headless server and be packaged into a GUI-free jar.
- `GuiAgentService` — owns the `gui.*` verbs and talks to the live Swing window via `GuiBridge`. It is only reachable in GUI mode.

Entry points:
- `-agent-stdio` → `HeadlessStdioMain` → `HeadlessAgentService` (never touches GUI).
- `-agent-gui-stdio` → `AgentStdioMain` → combined router (`AgentCommandDispatcher.COMBINED`).

For in-process embedding:
- Headless-only: call `HeadlessAgentService.invoke(request)` directly.
- Headless + GUI: use `AgentCommandDispatcher.dispatch(json)`.
