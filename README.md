# ClassyShark

### Introduction

![alt text](https://github.com/borisf/classyshark-user-guide/blob/master/images/5%20ClassesDexData.png)

ClassyShark is a standalone binary inspection tool for Android developers. It can reliably browse any Android executable and show important info such as class interfaces and members, dex counts and dependencies. ClassyShark supports multiple formats including libraries (.dex, .aar, .so), executables (.apk, .jar, .class) and all Android binary XMLs: AndroidManifest, resources, layouts etc.

### Useful links
* [User guide](https://github.com/borisf/classyshark-user-guide)
* [Command-line reference](https://github.com/google/android-classyshark/blob/master/CommandLine.pdf)
* Gradle [sample](https://github.com/google/android-classyshark/tree/master/Samples/SampleGradle)
* [Vision and Strategy](https://docs.google.com/document/d/1sK_WNzHn_6Q1V_dohxrtk1tlsPXsi9cEVnIuYuVig0M/edit?usp=sharing)

### Download
To run, grab the [latest JAR](https://github.com/google/android-classyshark/releases)
and run `java -jar ClassyShark.jar`.

### Export data in text format
* [Exporter](https://medium.com/@BorisFarber/exporting-data-from-classyshark-e3cf3fe3fab8#.deec4nyjq)
* API finder :construction: work in progress

### Develop
1. Clone the repo
2. Open in your favorite IDE/editor
3. Build options:
     * IntelliJ - builds automatically when exporting the project 
     * [Gradle script](https://github.com/google/android-classyshark/blob/master/ClassySharkWS/build.gradle)
     * [RetroBuild](https://github.com/borisf/RetroBuild)

### Arch Linux

If you're running Arch Linux you can install the latest [prebuilt jar from the AUR](https://aur.archlinux.org/packages/classyshark/).

### Dependencies
* [dexlib2](https://github.com/JesusFreke/smali/tree/master/dexlib2) by jesusfreke
* [guava](https://github.com/google/guava) by Google
* [ASM](http://asm.ow2.org/) by OW2
* [ASMDEX](http://asm.ow2.org/asmdex-index.html) by OW2
* [java-binutils](https://github.com/jawi/java-binutils) by jawi
* [BCEL](https://commons.apache.org/proper/commons-bcel) by Apache

### Support
If you've found an error, please file an issue:

https://github.com/google/android-classyshark/issues

Patches are encouraged, and may be submitted by forking this project and
submitting a pull request through GitHub.

## Claude Code marketplace install

This repo is a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugins). It
ships two agents — **`classyshark-headless`** (pure analysis) and **`classyshark-gui`** (drives the
live Swing window) — plus a **`get-started`** skill that tells Claude how to fetch the jar and pick
an agent.

**Install (in Claude Code, or in a terminal):**

```bash
# 1. Add this repo as a marketplace
claude plugin marketplace add github:android-security-engineer/android-classyshark-skills

# 2. Install the classyshark plugin
claude plugin install classyshark@android-classyshark-skills

# 3. Verify agents + skill are registered
claude plugin details classyshark@android-classyshark-skills
```

Or, interactively inside Claude Code: `/plugin marketplace add github:android-security-engineer/android-classyshark-skills`, then
`/plugin install classyshark`.

Then ask Claude to analyze a binary, e.g. "analyze this apk's methods and strings". Claude will
obtain the jar (from the [Releases](https://github.com/android-security-engineer/android-classyshark-skills/releases) /
[RELEASE.md](./RELEASE.md)) and drive ClassyShark through its JSON stdio protocol.

Marketplace layout:

```
.claude-plugin/marketplace.json   # marketplace manifest (→ plugin ./classyshark)
classyshark/
  .claude-plugin/plugin.json      # plugin manifest (metadata only)
  agents/classyshark-headless.md  # auto-discovered agents
  agents/classyshark-gui.md
  skills/get-started/SKILL.md     # auto-discovered skill
```

Validate locally: `claude plugin validate . --strict` and `claude plugin validate classyshark --strict`.

License
=======

    Copyright 2020 Google, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.



