# 🚀 GitHub Actions 部署

<Badge type="tip" text="部署" /> <Badge type="info" text="CI/CD" />

> 通过 `.github/workflows/docs.yml` 把 VitePress 文档站自动发布到 GitHub Pages。推送即构建，无需手动上传产物。

## 总览

部署 workflow 由两个 job 串联：`build` 负责把 Markdown 编译成静态站点并打包成 artifact，`deploy` 负责把 artifact 发布到 GitHub Pages。

```mermaid
flowchart LR
    A["push 到 master<br/>website/** 或 workflow 改动"] --> B["build job"]
    B --> B1["checkout"] --> B2["pnpm v10"] --> B3["Node 22 + cache"] --> B4["install --frozen-lockfile"] --> B5["pnpm build"] --> B6["configure-pages"] --> B7["upload-pages-artifact"]
    B7 --> C["deploy job<br/>needs build"]
    C --> C1["environment github-pages"] --> C2["deploy-pages@v4"]
    C2 --> D["🌍 Pages 站点上线"]
```

## 触发条件

```yaml
on:
  push:
    branches: [master]
    paths:
      - 'website/**'
      - '.github/workflows/docs.yml'
  workflow_dispatch:
```

| 触发器 | 触发时机 |
|--------|----------|
| `push`（master） | 只有改动落到 `website/**` 或 workflow 自身时才跑，避免改 Java 源码白跑一次 |
| `workflow_dispatch` | 支持在 Actions 页面手动点按钮触发，便于重发 |

::: tip 为何要 paths 过滤
仓库同时包含 ClassyShark Java 工具与 VitePress 文档站。若不过滤，任何 push 都会触发文档构建，浪费 CI 额度。`website/**` 覆盖 Markdown 与 `config.ts`，`.github/workflows/docs.yml` 确保改 workflow 本身能被验证。
:::

## 权限与会话控制

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true
```

| 字段 | 作用 |
|------|------|
| `pages: write` | 允许写入 Pages 服务，`deploy-pages` 必需 |
| `id-token: write` | 颁发 OIDC token，用于 actions 临时凭证（deploy-pages 的鉴权机制） |
| `contents: read` | 拉代码用，最小权限 |
| `concurrency: pages` | 把同一站点的并发部署串行化，避免互相覆盖 |
| `cancel-in-progress: true` | 新部署开始时取消正在跑的旧部署，节省资源 |

> ⚠️ 若仓库 **Settings → Actions → General → Workflow permissions** 收紧为只读，`pages: write` 也会被覆盖成只读，`deploy-pages` 报 403，详见 [部署故障排查 #7](./troubleshooting-deploy#_7-deploy-job-无权限)。

## build job

build job 在 `ubuntu-latest` 上完成「装环境 → 装依赖 → 构建 → 打包上传」四步。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: website/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: website

      - name: Build
        run: pnpm build
        working-directory: website

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: website/.vitepress/dist
```

### 步骤逐条解读

| 步骤 | action / 命令 | 关键点 |
|------|---------------|--------|
| 📥 Checkout | `actions/checkout@v4` | 拉取仓库源码，默认 `fetch-depth: 1`（浅克隆）。`lastUpdated` 依赖 Git 提交时间，浅克隆够用 |
| 📦 Setup pnpm | `pnpm/action-setup@v4` | `version: 10` 与 `pnpm-lock.yaml` 锁定的包管理器版本对齐 |
| 🟢 Setup Node | `actions/setup-node@v4` | `node-version: 22`（VitePress 1.x 要求 Node ≥ 18，22 是 LTS），`cache: pnpm` 缓存 store |
| 🧩 Install | `pnpm install --frozen-lockfile` | `--frozen-lockfile` 严禁改 lock，保证依赖树与本地一致；lock 与 package 不同步会失败 |
| 🏗️ Build | `pnpm build` | 等价 `vitepress build`，产物输出到 `website/.vitepress/dist` |
| ⚙️ Configure Pages | `actions/configure-pages@v5` | 注入 Pages 元数据（base path 等），为上传做准备 |
| 📤 Upload | `actions/upload-pages-artifact@v3` | 把 `dist` 打成名为 `github-pages` 的 artifact，供 deploy 消费 |

::: warning cache-dependency-path
`setup-node` 的 `cache: pnpm` 需要找到 lock 文件才能算缓存 key。本仓库 lock 在 `website/pnpm-lock.yaml` 而非根目录，必须显式指定 `cache-dependency-path`，否则缓存命中率为零。
:::

## deploy job

deploy job 依赖 build 成功，在 GitHub 托管的 Pages 环境里把 artifact 上线。

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

| 字段 | 作用 |
|------|------|
| `needs: build` | 必须等 build 成功才跑，build 失败则跳过部署 |
| `environment.name: github-pages` | 绑定 Pages 部署环境，GitHub 据此下发 `pages: write` 临时凭证 |
| `environment.url` | 部署完成后自动写入站点 URL，显示在 Actions 页面 |
| `actions/deploy-pages@v4` | 读取 build 上传的 `github-pages` artifact 并发布 |

`deploy-pages` **不需要也不接受** `path` 参数——它消费的是 build job 用 `upload-pages-artifact` 上传的那个固定 artifact。

## 完整 workflow

把上面的片段拼起来，即为 `.github/workflows/docs.yml` 全文：

```yaml
name: Deploy VitePress docs to GitHub Pages

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
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: website/pnpm-lock.yaml

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: website

      - name: Build
        run: pnpm build
        working-directory: website

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: website/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 上线前一次性配置

workflow 跑通只是部署的一半，仓库侧还要做两项设置：

| 配置项 | 位置 | 取值 |
|--------|------|------|
| Pages Source | Settings → Pages → Build and deployment → Source | `GitHub Actions`（非 Deploy from a branch） |
| Workflow permissions | Settings → Actions → General → Workflow permissions | `Read and write permissions` |

切 Source 必须是 `GitHub Actions`，否则即便 workflow 全绿，Pages 仍取不到产物，表现为 404 或空白，详见 [故障排查 #1](./troubleshooting-deploy#_1-pages-打开-404-空白)。

## 常见变体

| 需求 | 改法 |
|------|------|
| 只在打 tag 时发布正式版 | `on.push.tags: ['v*']`，`workflow_dispatch` 保留作手动回滚 |
| 多档环境（预览 + 正式） | 复制 job，用 `environment: preview` 与 `gh-pages-preview` 区分 |
| 加死链 / 类型检查 | build 步骤前插入 `pnpm exec vitepress build` 已含死链检查；TypeScript 主题可加 `pnpm exec tsc --noEmit` |
| 缓存 pnpm store 全量 | `pnpm/action-setup` 已内置 store 路径，配合 `setup-node` 的 `cache: pnpm` 即可 |

## 进一步阅读

- 🧪 [本地预览](./local-preview) — 本地复现 CI 的 build 产物
- 🔧 [部署故障排查](./troubleshooting-deploy) — 7 类高频部署失败根因与解决
- 📖 [VitePress 部署文档](https://vitepress.dev/guide/deploy#github-pages) — 官方推荐配置
- 🧩 [CliMode 模块文档](/reference/modules/CliMode) — ClassyShark CLI 入口
