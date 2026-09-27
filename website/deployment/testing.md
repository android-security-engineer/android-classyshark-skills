# 🧪 测试与验证

<Badge type="tip" text="部署" /> <Badge type="info" text="测试" />

> ClassyShark 的测试基线：任何改动都应附带"恰当的单元测试集"，且全部通过后再提交 PR 或发布。

## 测试策略

| 层 | 方式 | 覆盖内容 |
|----|------|----------|
| 🧪 单元测试 | JUnit（随源码仓库） | 核心逻辑：解析、翻译、方法计数、更新判断 |
| 🛠️ 手工验证 | `java -jar` 跑 CLI | 命令行入口与真实归档交互 |
| 🖥️ GUI 冒烟 | 打开 Swing 窗口 | 窗口构建、主题应用、拖拽加载 |
| 🚀 CI | GitHub Actions | 见 [GitHub Actions 详解](/deployment/github-actions) 与 [Pages 部署](/deployment/github-pages) |

## 提交前自检清单

```bash
# 1) 构建产物可正常生成
cd ClassySharkWS && ./gradlew fatJar

# 2) 对真实归档跑一遍核心命令
java -jar build/libs/ClassySharkWS-all.jar -inspect app.apk
java -jar build/libs/ClassySharkWS-all.jar -methodcounts app.apk | head -30
java -jar build/libs/ClassySharkWS-all.jar -export app.apk /tmp/out
java -jar build/libs/ClassySharkWS-all.jar -update /tmp/app.apk   # 或任意存在路径

# 3) 确认退出码/输出无异常
```

| ✅ | 检查项 |
|----|--------|
| ☐ | `fatJar` 构建通过 |
| ☐ | `-inspect` / `-methodcounts` / `-export` 三命令对真实 APK 无异常 |
| ☐ | 改动处附带单元测试且全部通过 |
| ☐ | 文档站改动 `cd website && pnpm build` 无 dead link |

## 测试文件放哪

```
ClassySharkWS/test/com/google/classyshark/...
```

与原仓库约定一致：测试与源码按包镜像，用 JUnit 断言核心纯逻辑（解析结果、翻译输出、版本比较），UI 层不写重测试（Swing 手工冒烟为主）。

## 相关文档

- 🧪 [本地预览](/deployment/local-preview) — 本地复现 CI 构建产物
- 🔧 [部署故障排查](/deployment/troubleshooting-deploy) — 常见失败根因
- 📐 [代码风格](/contributing/code-style) — 提交代码前对齐的规范