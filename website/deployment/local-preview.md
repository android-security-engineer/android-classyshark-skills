# 🧪 本地预览

<Badge type="tip" text="部署" /> <Badge type="info" text="开发服务器" />

> 在本地跑起 VitePress 文档站，实时预览改动并校验构建产物，再推送发布。

## 前置条件

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| 🟢 Node.js | ≥ 18 | VitePress 1.x 运行基线 |
| 📦 pnpm | 最新版 | 仓库已提交 `pnpm-lock.yaml`，保证依赖一致性 |
| 🔧 Git | 任意 | `lastUpdated` 依赖提交时间 |

::: tip 为何用 pnpm
`website/` 下已包含 `pnpm-lock.yaml`，使用 pnpm 可复现完全一致的依赖树，避免 npm/yarn 引入漂移。
:::

## 安装依赖

```bash
cd website
pnpm install
```

首次安装会拉取 `vitepress@1.6.4` 与 `mermaid@^11.4.0`（见 `package.json` 的 `devDependencies`）。`node_modules` 已在仓库中存在，但建议仍执行一次以同步可能的锁文件更新。

## 开发服务器

```bash
pnpm dev
```

启动后默认监听 `http://localhost:5173`。VitePress 提供热更新（HMR）：保存 Markdown 即可在浏览器即时看到变化，无需手动刷新。

::: warning ⚠️ Base Path 注意事项
本站 `.vitepress/config.ts` 配置了 `base: '/android-classyshark-skills/'`，因此：

- 访问地址实际是 `http://localhost:5173/android-classyshark-skills/`
- 资源、内部链接都带此前缀，模拟 GitHub Pages 真实路径

如果希望直接从根路径访问，可临时把 `base` 改成 `'/'`：

```bash
# 临时改 base（仅本地调试，勿提交）
sed -i "s|base: '/android-classyshark-skills/'|base: '/'|" .vitepress/config.ts
pnpm dev   # 现在访问 http://localhost:5173/
```
:::

## 构建产物

```bash
pnpm build
```

构建流程示意：

```mermaid
flowchart LR
    A["Markdown 源文件<br/>website/**/*.md"] --> B["vitepress build"]
    B --> C["dist/<br/>静态 HTML + JS + CSS"]
    C --> D["部署目标<br/>GitHub Pages / 任意静态托管"]
```

产物输出到 `website/.vitepress/dist/`（默认 `outDir`）。该目录为构建生成，不应提交到仓库。

## 预览构建产物

```bash
pnpm preview
```

`vitepress preview` 会启动一个本地静态服务器托管 `dist/`，用于在发布前确认**生产构建**效果与开发态一致——某些问题只在构建后出现（例如死链、Mermaid 图渲染失败），必须用 `preview` 才能复现。

## 命令速查

| 命令 | 作用 | 对应 script |
|------|------|-------------|
| `pnpm install` | 安装依赖 | — |
| `pnpm dev` | 热更新开发服务器 | `vitepress dev` |
| `pnpm build` | 生产构建到 `dist/` | `vitepress build` |
| `pnpm preview` | 预览构建产物 | `vitepress preview` |

## 关键配置说明

### cleanUrls

```ts
cleanUrls: true   // .vitepress/config.ts
```

开启后，生成的 URL 与内部链接**省略 `.html` 后缀**，例如 `/cli/index` 而非 `/cli/index.html`。优点：

- 链接更简洁、可读
- 与 GitHub Pages 的 Jekyll 风格更一致
- 内部跳转如 [CLI 参考](/cli/index)、[GUI 参考](/gui/index) 都依赖此设置

::: warning 部署兼容性
开启 `cleanUrls` 后，托管平台必须支持**目录回退**（fallback 到 `index.html`）。GitHub Pages 默认支持；若部署到不支持回退的 Nginx，需配置 `try_files`。
:::

### lastUpdated

```ts
lastUpdated: true   // .vitepress/config.ts
```

基于 **Git 提交时间**在每个页面底部显示「最后更新」（`lastUpdatedText: '最后更新'`）。含义与注意点：

- 时间戳取自该 Markdown 文件最近一次 Git 提交，**非文件 mtime**
- 本地新文件未提交时显示当前时间，提交后才固定
- 仅在构建时（`pnpm build`）注入，开发态可能不显示

## 典型工作流

```bash
# 1. 进入目录并安装
cd website && pnpm install

# 2. 起开发服务器，边写边看
pnpm dev
# → 浏览器开 http://localhost:5173/android-classyshark-skills/

# 3. 写完后构建
pnpm build

# 4. 预览生产产物
pnpm preview

# 5. 满意后提交并推送，触发 GitHub Pages 部署
git add -A && git commit -m "docs: 更新文档" && git push
```

## 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 🚫 页面空白 / 404 | 忘了 `base` 前缀 | 访问 `…/android-classyshark-skills/`，或临时把 `base` 改 `/` |
| 🚫 Mermaid 不渲染 | 漏装依赖或构建态问题 | 确认 `pnpm install` 含 `mermaid`，用 `pnpm preview` 复现 |
| 🚫 「最后更新」不显示 | 文件未 Git 提交 | `git add` + `commit` 后重新 `pnpm build` |
| 🚫 链接 404 | 部署平台无目录回退 | 服务器配置 `try_files $uri $uri/ $uri/index.html` |

## 进一步阅读

- 🚀 [GitHub Pages 部署](./github-pages) — 自动发布流程
- 🧩 [Main 模块文档](/reference/modules/Main) — ClassyShark 程序入口
- 📖 [VitePress 官方文档](https://vitepress.dev/) — 配置项完整参考
