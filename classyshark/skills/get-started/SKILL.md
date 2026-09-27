---
name: classyshark-get-started
description: Windows the ClassyShark Agent plugin. Use when the user wants to analyze an APK/JAR/DEX/class/ELF binary, get the ClassyShark jar, or pick between the headless and GUI agents. Trigger phrases: "analyze this apk", "classyshark", "dex strings", "method counts", "who loads natives".
---

# ClassyShark get-started

This plugin gives Claude two ways to inspect Android / Java binaries with
[ClassyShark](https://github.com/google/android-classyshark): a **headless**
agent for pure analysis and a **GUI** agent that controls the live Swing window.

## 1. Get the jar

The agents launch `java -jar <jar> -agent-stdio` / `-agent-gui-stdio`, so the
runnable all-in-one jar must be downloaded first. Get it from this project's
GitHub Releases:

```
# pick the latest version tag, e.g. v1.0.0
curl -sL -o ClassyShark.jar \
  https://github.com/android-security-engineer/android-classyshark-skills/releases/download/v1.0.0/ClassySharkWS-all-1.0.0.jar
```

Or ask the user for the path to an already-built jar. Verify with
`java -jar ClassyShark.jar -version` (or a trivial `agent.capabilities` call).

## 2. Pick an agent

| Need | Agent | Mode |
|---|---|---|
| Non-interactive analysis, no display server | `classyshark-headless` | `-agent-stdio` |
| Drive a live GUI window, human still usable | `classyshark-gui` | `-agent-gui-stdio` |

- **Headless**: launch per the agent doc, pipe one JSON request per line.
  `agent.capabilities` lists available `archive.*` / `apk.*` commands.
- **GUI**: launch with `-agent-gui-stdio [archive]`. Prefer the synchronous
  `*_and_wait` commands; check `gui.status.humanRecentlyActive` before
  disruptive actions.

## 3. Protocol

One JSON request line in, one JSON response line out. Success carries
`status:"ok"` + `data`; failure carries `status:"error"` + an `error.code`.

Read the two agent docs (`./agents/classyshark-headless.md`,
`./agents/classyshark-gui.md`) for the full command reference before using.