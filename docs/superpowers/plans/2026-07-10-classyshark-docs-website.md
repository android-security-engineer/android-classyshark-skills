# ClassyShark VitePress 文档站建设实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** 在仓库根目录创建 `website/`，基于 VitePress 1.6.4 渲染，配 GitHub Action CI/CD + GitHub Pages 部署，文档覆盖全部 133 个 Java 模块与所有功能点，达 200+ Markdown 文件，让用户只看文档站即可学会项目。

**Architecture:** 用户/CI → `pnpm build`（VitePress 静态生成）→ `website/.vitepress/dist` → GitHub Action `deploy-pages` → GitHub Pages（base path `/android-classyshark-skills/`）。文档站结构 = 首页 + 8 个 section（guide/tutorials/cli/gui/api/reference.architecture/reference.modules/deployment/contributing）。模块文档按 Java 包路径镜像，每篇含职责/关键方法/设计要点/已知问题。内容生产用 Workflow 并行 fan-out，每个 agent 负责一个子系统下若干模块文档，写入独立文件路径避免冲突。复用 ClassyShark 既有分层架构（ContentReader→TranslatorFactory→Translator）作为文档叙事主线。

**Tech Stack:** Node.js 22.19, pnpm 10.15, VitePress 1.6.4, mermaid, TypeScript 5, GitHub Actions（actions/configure-pages, upload-pages-artifact, deploy-pages v4）

**Risks:**
- GitHub Pages 需用户首次在仓库 Settings→Pages→Source 选 "GitHub Actions"（一次性 UI 操作，文档说明）→ 缓解：deployment/base-path.md 写清步骤
- 200+ 文档人工写不现实，用 Workflow 并行生产 → 缓解：agent 写不同文件路径（按类名），无写冲突；骨架 config 由人工写确保 sidebar 正确
- VitePress build 对死链报错 → 缓解：sidebar 用相对路径，每轮 Workflow 后跑一次 build 验证
- 模块文档准确性依赖源码 → 缓解：agent 拿到 Explore 结论摘要 + 实际源码路径，要求引用 `文件:行号`

---

### Task 1: VitePress 骨架与构建验证

**Depends on:** None
**Files:**
- Create: `website/package.json`
- Create: `website/.vitepress/config.ts`
- Create: `website/.vitepress/theme/index.ts`
- Create: `website/.vitepress/theme/custom.css`
- Create: `website/index.md`
- Create: `website/public/logo.svg`
- Create: `website/.gitignore`

- [ ] **Step 1: 创建 website/package.json — 声明 vitepress 依赖与脚本**

```json
{
  "name": "classyshark-docs",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "1.6.4",
    "mermaid": "^11.4.0"
  }
}
```

- [ ] **Step 2: 创建 website/.vitepress/config.ts — 站点配置（base path 指向 Pages 子路径）**

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ClassyShark',
  description: 'Android 二进制检查工具 — 浏览任意 Android 可执行文件',
  lang: 'zh-CN',
  base: '/android-classyshark-skills/',
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname: 'https://android-security-engineer.github.io/android-classyshark-skills/'
  },
  head: [
    ['link', { rel: 'icon', href: '/android-classyshark-skills/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2b5fff' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ClassyShark 🦈',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/android-security-engineer/android-classyshark-skills' }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    nav: [
      { text: '🦈 指南', link: '/guide/what-is-classyshark' },
      { text: '🛠️ CLI', link: '/cli/index' },
      { text: '🖥️ GUI', link: '/gui/index' },
      { text: '📚 API', link: '/api/index' },
      { text: '🧩 模块', link: '/reference/modules/Main' },
      { text: '🚀 部署', link: '/deployment/github-pages' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '什么是 ClassyShark', link: '/guide/what-is-classyshark' },
            { text: '安装', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '架构总览', link: '/guide/architecture-overview' },
            { text: '支持的格式', link: '/guide/supported-formats' }
          ]
        },
        {
          text: '核心概念',
          collapsed: false,
          items: [
            { text: 'DEX 与 Dalvik', link: '/guide/concepts/dex' },
            { text: 'APK 结构', link: '/guide/concepts/apk' },
            { text: 'JAR 与 AAR', link: '/guide/concepts/jar-aar' },
            { text: 'ELF 与 .so', link: '/guide/concepts/elf-so' },
            { text: '二进制 XML', link: '/guide/concepts/binary-xml' },
            { text: 'Multidex', link: '/guide/concepts/multidex' },
            { text: '方法数 65k 限制', link: '/guide/concepts/method-counts-65k' },
            { text: 'ProGuard 映射', link: '/guide/concepts/proguard-mapping' },
            { text: '反射 vs ASM vs dexlib2', link: '/guide/concepts/reflect-vs-asm-vs-dexlib' }
          ]
        },
        {
          text: '参考',
          collapsed: false,
          items: [
            { text: 'FAQ', link: '/guide/faq' },
            { text: '故障排查', link: '/guide/troubleshooting' },
            { text: '术语表', link: '/guide/glossary' }
          ]
        }
      ],
      '/tutorials/': [
        {
          text: '实战教程',
          collapsed: false,
          items: [
            { text: '分析 APK 体积', link: '/tutorials/analyze-apk-size' },
            { text: '检查 Manifest', link: '/tutorials/inspect-manifest' },
            { text: '发现重复依赖', link: '/tutorials/find-duplicate-libs' },
            { text: '统计方法数', link: '/tutorials/count-methods' },
            { text: '反混淆 ProGuard', link: '/tutorials/reverse-proguard' },
            { text: '检查 native 库', link: '/tutorials/inspect-native-libs' },
            { text: '导出数据', link: '/tutorials/export-data' },
            { text: '作为库使用', link: '/tutorials/use-as-library' },
            { text: '源码构建', link: '/tutorials/build-from-source' }
          ]
        }
      ],
      '/cli/': [
        {
          text: '命令行参考',
          collapsed: false,
          items: [
            { text: '总览', link: '/cli/index' },
            { text: '-open', link: '/cli/open' },
            { text: '-export', link: '/cli/export' },
            { text: '-inspect', link: '/cli/inspect' },
            { text: '-methodcounts', link: '/cli/methodcounts' },
            { text: '-update', link: '/cli/update' },
            { text: '用法示例', link: '/cli/usage-examples' },
            { text: '退出码', link: '/cli/exit-codes' }
          ]
        }
      ],
      '/gui/': [
        {
          text: 'GUI 参考',
          collapsed: false,
          items: [
            { text: '总览', link: '/gui/index' },
            { text: '面板布局', link: '/gui/panels' },
            { text: '类树导航', link: '/gui/tree' },
            { text: '显示区', link: '/gui/display-area' },
            { text: '环形图', link: '/gui/ring-chart' },
            { text: '方法计数', link: '/gui/methods-count' },
            { text: '主题', link: '/gui/themes' },
            { text: '快捷键', link: '/gui/shortcuts' },
            { text: '拖拽', link: '/gui/drag-drop' },
            { text: '最近归档', link: '/gui/recent-archives' }
          ]
        }
      ],
      '/api/': [
        {
          text: '编程 API',
          collapsed: false,
          items: [
            { text: '总览', link: '/api/index' },
            { text: 'Shark 类', link: '/api/shark-class' },
            { text: 'SilverGhostFacade', link: '/api/silverghost-facade' },
            { text: 'Translator SPI', link: '/api/translator-spi' },
            { text: 'ContentReader SPI', link: '/api/contentreader-spi' },
            { text: 'TokensMapper', link: '/api/tokensmapper' },
            { text: 'FullArchiveReader', link: '/api/fullarchivereader' },
            { text: '示例', link: '/api/examples' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '架构总览',
          collapsed: false,
          items: [
            { text: '入口层', link: '/reference/architecture/entry-layer' },
            { text: 'SilverGhost 引擎', link: '/reference/architecture/silverghost-engine' },
            { text: 'ContentReader', link: '/reference/architecture/contentreader' },
            { text: 'Translator', link: '/reference/architecture/translator' },
            { text: 'MethodsCounter', link: '/reference/architecture/methodscounter' },
            { text: 'Exporter', link: '/reference/architecture/exporter' },
            { text: 'Plugins SPI', link: '/reference/architecture/plugins-spi' },
            { text: 'Analytics', link: '/reference/architecture/analytics' },
            { text: 'Updater', link: '/reference/architecture/updater' },
            { text: 'Android 端', link: '/reference/architecture/android-port' },
            { text: '构建系统', link: '/reference/architecture/build-system' },
            { text: '依赖', link: '/reference/architecture/dependencies' }
          ]
        },
        {
          text: '🧩 模块文档',
          collapsed: false,
          items: [
            { text: 'Main（入口）', link: '/reference/modules/Main' },
            { text: '模块索引', link: '/reference/modules/' }
          ]
        }
      ],
      '/deployment/': [
        {
          text: '部署',
          collapsed: false,
          items: [
            { text: 'GitHub Actions', link: '/deployment/github-actions' },
            { text: 'GitHub Pages', link: '/deployment/github-pages' },
            { text: 'base path', link: '/deployment/base-path' },
            { text: '本地预览', link: '/deployment/local-preview' },
            { text: '部署故障排查', link: '/deployment/troubleshooting-deploy' },
            { text: '自定义域名', link: '/deployment/custom-domain' }
          ]
        }
      ],
      '/contributing/': [
        {
          text: '贡献',
          collapsed: false,
          items: [
            { text: '如何贡献', link: '/contributing/index' },
            { text: '代码风格', link: '/contributing/code-style' },
            { text: '测试', link: '/contributing/testing' },
            { text: 'CLA', link: '/contributing/cla' },
            { text: '新增文档', link: '/contributing/add-a-doc' }
          ]
        }
      ]
    },
    footer: {
      message: '基于 Apache 2.0 协议发布',
      copyright: 'Copyright © 2020 Google, Inc.'
    }
  }
})
```

- [ ] **Step 3: 创建 website/.vitepress/theme/index.ts — 自定义主题（图标体系 + mermaid）**

```typescript
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 全局组件可在未来扩展
  }
} satisfies Theme
```

- [ ] **Step 4: 创建 website/.vitepress/theme/custom.css — 配色增强与模块卡片样式**

```css
:root {
  --vp-c-brand-1: #2b5fff;
  --vp-c-brand-2: #1e4ad6;
  --vp-c-brand-3: #6b8dff;
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #2b5fff, #00c4b4);
  --vp-home-hero-image-background-image: linear-gradient(-45deg, #2b5fff55, #00c4b455);
  --vp-home-hero-image-filter: blur(40px);
}

.VPDoc:not(.has-sidebar) .content-container { max-width: 920px; }

/* 模块文档卡片 */
.module-header {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.module-source {
  background: var(--vp-code-bg);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  margin: 12px 0;
}
```

- [ ] **Step 5: 创建 website/public/logo.svg — 鲨鱼风格 logo**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#2b5fff"/>
  <text x="32" y="42" font-size="34" text-anchor="middle" fill="white">🦈</text>
</svg>
```

- [ ] **Step 6: 创建 website/index.md — 首页（Hero + 特性卡）**

```markdown
---
layout: home

hero:
  name: ClassyShark
  text: Android 二进制检查工具
  tagline: 浏览任意 Android 可执行文件，查看类接口、方法数、依赖与 Manifest
  image:
    src: /logo.svg
    alt: ClassyShark
  actions:
    - theme: brand
      text: 🚀 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 📖 了解工具
      link: /guide/what-is-classyshark

features:
  - icon: 📦
    title: 多格式支持
    details: APK / DEX / JAR / AAR / SO / CLASS，以及所有 Android 二进制 XML（Manifest、布局、资源）。
  - icon: 📊
    title: 方法数分析
    details: 按包聚合统计方法数，环形图可视化，定位 65k 限制与体积来源。
  - icon: 🔍
    title: 依赖检查
    details: 检测重复图像/HTTP/JSON 库、私有 NDK 库、不安全后台广播。
  - icon: 🛠️
    title: CLI 友好
    details: -export / -inspect / -methodcounts 命令，适合 CI/CD 集成。
  - icon: 🖥️
    title: GUI 浏览
    details: Swing 图形界面，类树导航、源码存根、深色/浅色主题。
  - icon: 📚
    title: 编程 API
    details: Shark facade 可作为库嵌入构建工具链。
---
```

- [ ] **Step 7: 创建 website/.gitignore — 排除构建产物与依赖**

```text
node_modules
.vitepress/dist
.vitepress/cache
*.log
```

- [ ] **Step 8: 安装依赖并验证空站构建**

Run: `cd website && pnpm install && pnpm build`

Expected:
  - Exit code: 0
  - Output contains: "building client + ssr bundles"
  - Output contains: "rendered" 或 "✓ built"
  - 目录 `website/.vitepress/dist` 存在，含 `index.html`

- [ ] **Step 9: 提交**

Run: `git add website/ && git commit -m "feat(website): scaffold vitepress docs site with config and theme"`

---

### Task 2: guide / tutorials / cli / gui / api / deployment / contributing 核心文档

**Depends on:** Task 1
**Files:**
- Create: `website/guide/` 下 ~15 篇
- Create: `website/tutorials/` 下 9 篇
- Create: `website/cli/` 下 8 篇
- Create: `website/gui/` 下 10 篇
- Create: `website/api/` 下 8 篇
- Create: `website/reference/architecture/` 下 12 篇
- Create: `website/deployment/` 下 6 篇
- Create: `website/contributing/` 下 5 篇

- [ ] **Step 1: 创建 guide/what-is-classyshark.md — 工具解决的问题与方案**

```markdown
# 🦈 什么是 ClassyShark

<Badge type="tip" text="指南" /> <Badge type="info" text="概念" />

> ClassyShark 是 Google 开源的 **Android 二进制检查工具**，可浏览任意 Android 可执行文件并展示类接口、方法数与依赖。

## 它解决什么问题？

Android 应用编译后是一堆 **二进制格式**，开发者无法直接阅读：

| 格式 | 内容 | 痛点 |
|------|------|------|
| 📦 APK | 完整应用包 | 不知包含哪些库、native 库是否违规 |
| 🧩 DEX | Dalvik 字节码 | 不知方法数是否超 65k |
| ☕ JAR/AAR | Java 库 | 不知依赖来源 |
| 🐚 SO | native 库 | 不知符号、依赖 |
| 📄 二进制 XML | Manifest/资源 | 无法用文本编辑器打开 |

## 它如何解决？

ClassyShark 采用 **分层翻译架构**：

\`\`\`mermaid
flowchart LR
    A[二进制归档<br/>APK/DEX/JAR/SO] --> B[ContentReader<br/>按格式解析]
    B --> C[TranslatorFactory<br/>按扩展名分发]
    C --> D1[AndroidXmlTranslator]
    C --> D2[DexInfoTranslator]
    C --> D3[ElfTranslator]
    C --> D4[JavaTranslator]
    D1 & D2 & D3 & D4 --> E[可读文本/树/环形图]
\`\`\`

## 三种入口

- 🖥️ **GUI** — `java -jar ClassyShark.jar -open app.apk`
- 🛠️ **CLI** — `java -jar ClassyShark.jar -inspect app.apk`
- 📚 **API** — `Shark.with(apk).getAllMethods()`

详见 [快速开始](./quick-start) 与 [架构总览](./architecture-overview)。
```

- [ ] **Step 2: 创建 guide/quick-start.md — 3 分钟跑通 GUI 与 CLI**

```markdown
# 🚀 快速开始

<Badge type="tip" text="指南" />

## 前置条件

- ☕ Java 8+（JDK 1.8）
- 下载 [最新 ClassyShark.jar](https://github.com/android-classyshark/releases)

## GUI 模式

\`\`\`bash
java -jar ClassyShark.jar
\`\`\`

拖入一个 APK，左侧类树浏览，右侧查看类存根。

## CLI 模式

\`\`\`bash
# 检查 APK 仪表盘
java -jar ClassyShark.jar -inspect app.apk

# 统计方法数
java -jar ClassyShark.jar -methodcounts app.apk

# 导出全量数据
java -jar ClassyShark.jar -export app.apk
\`\`\`

详见 [CLI 参考](/cli/index)。
```

- [ ] **Step 3: 用 Workflow 并行生产 guide 剩余篇目（installation/architecture-overview/supported-formats/concepts 系列/faq/troubleshooting/glossary）**

调用 Workflow，fan-out 6 个 agent，每个写 2-4 篇 guide 文档到独立路径。每篇遵循统一模板：标题 + Badge + 引用源码 `文件:行号` + mermaid 图（适用时）。

- [ ] **Step 4: 用 Workflow 并行生产 tutorials / cli / gui / api / deployment / contributing / reference.architecture 各篇**

调用 Workflow，按 section 分组 fan-out。每个 agent 拿到对应 Explore 结论摘要（见计划末"调研附录"），产出 Markdown 写入对应路径。每篇 80-200 行，含图标、表格、代码示例。

- [ ] **Step 5: 验证 section 文档构建无死链**

Run: `cd website && pnpm build`

Expected:
  - Exit code: 0
  - Output 不含 "dead links"
  - Output 不含 "error"

- [ ] **Step 6: 提交**

Run: `git add website/guide website/tutorials website/cli website/gui website/api website/deployment website/contributing website/reference/architecture && git commit -m "docs(website): add guide, tutorials, cli, gui, api, deployment, architecture docs"`

---

### Task 3: 全部 133 个模块文档（reference/modules/）

**Depends on:** Task 2
**Files:**
- Create: `website/reference/modules/` 下 133 篇（每类一篇）
- Create: `website/reference/modules/index.md` 模块索引页

- [ ] **Step 1: 用 Workflow 按 9 个子系统分组并行生产模块文档**

Workflow 脚本分组（每组一个 agent，写入各自类名.md，无路径冲突）：
- 组1 入口层：Main, Shark, Version, CliMode, GuiMode（5）
- 组2 silverghost 核心：SilverGhostFacade, SilverGhost, FullArchiveReader, TokensMapper, SherlockHash（5）
- 组3 contentreader：ContentReader, BinaryContentReader, ApkReader, DexReader, DexlibLoader, JarReader, AarReader, ClazzReader, ClassNameVisitor（9）
- 组4 translator 核心+xml+dex+elf+jar：Translator, TranslatorFactory, AndroidXmlTranslator, XmlDecompressor, XmlHighlighter, DexInfoTranslator, DexMethodsDumper, DexStringsDumper, ElfReader, ElfTranslator, JarInfoTranslator（11）
- 组5 apk dashboard：ApkTranslator, ApkDashboard, ApkNativeMethodsVisitor, ClassesDexDataEntry, DynamicSymbolsInspector, JavaDependenciesInspector, PrivateNativeLibsInspector, SyntheticAccessorsInspector, Table, AndroidManifestPlainTextReader, ManifestInspector, ReceiverActionsBL（12）
- 组6 java translator：JavaTranslator, MetaObject, MetaObjectFactory, MetaObjectWithMapper, StressTest, QualifiedTypesMap, ClassBytesFromJarExtractor, ClassDetailsFiller, MetaObjectAsmClass, ClassUtils, MetaObjectClass, DexlibAdapter, MetaObjectDex, MultidexReader（14）
- 组7 methodscounter+exporter+plugins：ClassInfo, ClassNode, RootBuilder, Exporter, MethodCountExporter, FlatMethodCountExporter, TreeMethodCountExporter, EmptyFullArchiveReader, IdentityMapper（9）
- 组8 gui 顶层+panel+tree+displayarea+chart+methodscount+reducer+toolbar+io+settings：GuiMode, ClassySharkPanel, ViewerController, ArchiveDisplayer, FileTransferHandler, FilesTree, NodeInfo, CellRenderer, DisplayArea, IDisplayArea, BatchDocument, Doodle, ChristmasBG, SanFranBG, SharkBG, RingChart, RingChartPanel, MethodsCountPanel, Reducer, Toolbar, ToolbarController, RecentArchivesButton, KeyUtils, CurrentFolderConfig, FileChooserUtils, RecentArchivesConfig, SettingsFrame, ThemeChosenListener（28）
- 组9 theme+analytics+updater+android+samples：Theme, ThemeManager, SwingThemeApplier, DarkTheme, DarkColorScheme, DarkIconScheme, LightTheme, LightColorScheme, LightIconScheme, Analytics, FocusPoint, GoogleAnalytics_v1_URLBuildingStrategy, HTTPGetMethod, JGoogleAnalyticsTracker, LoggingAdapter, URLBuildingStrategy, UpdateManager, Release, ReleaseDownloadData, AbstractDownloader, AbstractReleaseCallback, CliDownloader, GuiDownloader, GitHubApi, MessageRunnable, NetworkManager, FileUtils, NamingUtils, MainActivity, ClassesListActivity, SourceViewerActivity, StableArrayAdapter, DexLoaderBuilder, Reflector, ClassesNamesList, ClassTypeAlgorithm, IOUtils, UriUtils, Main(sample)（38）

每个 agent 输入：该组类的 Explore 结论摘要 + 统一模块模板 + 实际源码相对路径。输出：每类一篇 Markdown。

- [ ] **Step 2: 创建模块文档统一模板（写入每个模块页）**

每个模块页遵循此结构（agent 须严格遵守）：

```markdown
# 🧩 {类名}

<div class="module-header">
<Badge type="tip" text="{子系统}" /> <Badge type="info" text="{设计模式}" />
</div>

> {一句话职责}

<div class="module-source">
📁 源码：<code>{相对路径}</code> &nbsp; 📦 包：<code>{package}</code>
</div>

## 职责
{2-4 句详细职责}

## 关键方法 / 字段
| 名称 | 类型 | 说明 |
|------|------|------|
| ... | ... | ... |

## 工作流程
\`\`\`mermaid
{流程图（适用时）}
\`\`\`

## 设计要点
- {要点1}
- {要点2}

## 协作关系
- 依赖：[[{类名}]]
- 被调用：[[{类名}]]

## 已知问题 / TODO
- ⚠️ {问题}

## 相关文档
- [{链接文本}](/guide/...)
```

- [ ] **Step 3: 创建 reference/modules/index.md — 模块索引页（按子系统分组列表）**

```markdown
# 🧩 模块索引

ClassyShark 全部代码模块文档，按子系统分组。

## 入口层
- [Main](./Main) — 驱动类
- [Shark](./Shark) — 编程 API
...（全部 133 项，按 9 组列出）
```

- [ ] **Step 4: 验证模块文档构建无死链**

Run: `cd website && pnpm build`

Expected:
  - Exit code: 0
  - Output 不含 "dead links"
  - `find website/reference/modules -name '*.md' | wc -l` ≥ 133

- [ ] **Step 5: 统计总文档数达标**

Run: `find website -name '*.md' | wc -l`

Expected:
  - 输出 ≥ 200

- [ ] **Step 6: 抽查 5 篇模块文档准确性**

抽查 Main / SilverGhostFacade / TranslatorFactory / XmlDecompressor / RingChart 五篇，核对类名、方法名、源码路径与实际代码一致。

Expected: 全部一致，无虚构方法

- [ ] **Step 7: 提交**

Run: `git add website/reference/modules && git commit -m "docs(website): add per-module docs for all 133 java classes"`

---

### Task 4: GitHub Actions CI/CD 与 Pages 部署

**Depends on:** Task 3
**Files:**
- Create: `.github/workflows/docs.yml`
- Modify: 根 `.gitignore`（增补 website 忽略项，若需要）

- [ ] **Step 1: 创建 .github/workflows/docs.yml — 构建并部署到 Pages**

```yaml
name: Deploy Docs

on:
  push:
    branches: [master]
    paths:
      - 'website/**'
      - '.github/workflows/docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: website/pnpm-lock.yaml
      - name: Install
        working-directory: website
        run: pnpm install --frozen-lockfile
      - name: Build
        working-directory: website
        run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: website/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 生成 pnpm-lock.yaml 确保 frozen-lockfile 可用**

Run: `cd website && pnpm install && git add pnpm-lock.yaml`

Expected:
  - `website/pnpm-lock.yaml` 生成并被暂存

- [ ] **Step 3: 验证 workflow YAML 语法**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/docs.yml')); print('yaml ok')"`

Expected:
  - 输出 "yaml ok"
  - Exit code: 0

- [ ] **Step 4: 提交**

Run: `git add .github/workflows/docs.yml website/pnpm-lock.yaml && git commit -m "ci: add github actions workflow for vitepress docs deployment to pages"`

---

## 调研附录：133 模块 Explore 结论摘要（供 Workflow agent 使用）

已由 2 个 Explore agent 完成全量调研，结论已记录在对话上下文与 `/home/cc11001100/.claude/plans/resilient-doodling-scott.md` 的 Context 段落中。关键已知问题清单（模块文档须如实标注）：

1. `TranslatorFactory` 无 `.zip` 分支，但 `FileChooserUtils` 接受 `.zip` → 不一致
2. `KeyUtils` 用裸键码（8/37/39/157）而非 `KeyEvent.VK_*`
3. `JarReader` native lib 检测 `startsWith(".so")` 疑似应为 `endsWith`
4. `SyntheticAccessorsInspector` 已实现但在 `ApkDashboard` 中被注释掉
5. `RecentArchivesConfig` 按字典序排序而非 LRU
6. 浅色主题 `applyTo` 是空操作，深色主题覆盖全部组件——刻意非对称
7. `XmlDecompressor` 是独立于 AOSP/aapt 的二进制 XML 解码器
8. `MetaObjectFactory` 反射优先、ASM 兜底的三路 MetaObject 策略

Workflow agent prompt 须包含上述摘要 + 该类实际源码路径 + 模块模板。
