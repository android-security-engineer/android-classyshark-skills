# 🛠️ CLI 参考

<Badge type="tip" text="CLI" />

> ClassyShark 的命令行模式适合脚本与 CI/CD 自动化。

## 用法

```bash
java -jar ClassyShark.jar [-options] <archive> [args...]
```

无参数或 `-open` 走 GUI，详见 [GUI 参考](/gui/index)。

## 命令一览

| 命令 | 说明 | 文档 |
|------|------|------|
| `-open` | 用 GUI 打开归档 | [-open](./open) |
| `-export` | 导出全量或单个类数据 | [-export](./export) |
| `-inspect` | 打印 APK 分析仪表盘 | [-inspect](./inspect) |
| `-methodcounts` | 按包统计方法数 | [-methodcounts](./methodcounts) |
| `-update` | 检查并更新 ClassyShark | [-update](./update) |

## 入口实现

CLI 入口在 [`CliMode`](/reference/modules/CliMode)。它解析首参为操作符（operand），第二个为归档文件，按 `switch` 分发：

- `-export` — 2 个参数导出整个归档，3 个参数导出指定类
- `-inspect` — 调 `SilverGhostFacade.inspectApk`
- `-methodcounts` — 调 `SilverGhostFacade.inspectPackages`，支持 `-flat`
- `-update` — 调 `UpdateManager.checkVersionConsole`

## 快速示例

```bash
# 分析 APK
java -jar ClassyShark.jar -inspect app.apk

# 方法计数（树形）
java -jar ClassyShark.jar -methodcounts app.apk

# 方法计数（扁平）
java -jar ClassyShark.jar -methodcounts app.apk -flat

# 导出全量数据
java -jar ClassyShark.jar -export app.apk

# 导出单个类
java -jar ClassyShark.jar -export app.apk com.bumptech.glide.request.target.BaseTarget

# 自更新
java -jar ClassyShark.jar -update dummy.apk
```

> ⚠️ `-update` 的实现要求第二个参数存在（`CliMode` 要求 `args.size() >= 2`），可传任意路径占位。

详见 [用法示例](./usage-examples) 与 [退出码](./exit-codes)。
