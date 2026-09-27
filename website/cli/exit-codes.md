# 🚪 退出码与错误处理

<Badge type="tip" text="CLI" />
<Badge type="info" text="错误处理" />

> ClassyShark CLI 在出错时通过 `System.err` 打印消息并直接 `return`，**不抛异常、不设进程退出码**。本文梳理 [`CliMode`](/reference/modules/CliMode) 及 `SilverGhostFacade`/`Exporter` 的错误分支。

## 🧭 错误处理总览

[`CliMode.with(List<String> args)`](/reference/modules/CliMode) 按三层顺序校验，任一失败即打印后 `return`，不再继续分发：

```mermaid
flowchart TD
    A[CliMode.with 入口] --> B{args.size() < 2?}
    B -- 是 --> E1[stderr: missing command line arguments<br/>+ USAGE]
    B -- 否 --> C{new File args.get1 .exists?}
    C -- 否 --> E2[stderr: File doesn't exist ==&gt; path<br/>+ USAGE]
    C -- 是 --> D{operand 命中 switch?}
    D -- 否 default --> E3[stderr: wrong operand ==&gt; op<br/>+ USAGE]
    D -- 是 --> F[分发到对应操作]
    F --> G{运行期异常?}
    G -- 是 --> E4[stderr: Internal error - couldn't write file]
    G -- 否 --> H[正常完成]
```

::: tip 关键事实
CLI **不调用 `System.exit`**，所有错误分支都是 `System.err.println(...)` + `return`。因此在脚本里**不能靠 `$?` 区分错误类型**，应改为捕获 `stderr` 文本。
:::

## 📋 参数校验分支

### 1️⃣ 参数不足（`args.size() < 2`）

`CliMode` 要求至少 2 个参数：operand 与归档路径。不足时打印：

```text
missing command line arguments

Usage: java -jar ClassyShark.jar [-options] <archive> [args...]
           (to execute a ClassyShark on binary archive jar/apk/dex/class)
where options include:
    -open	  open an archive with GUI
    -export	  export to file
    -methodcounts	  packages with method counts
    -inspect  experimental prints apk analysis
    -update	updates ClassyShark
where args is an optional classname
```

### 2️⃣ 文件不存在

```java
File archiveFile = new File(args.get(1));
if (!archiveFile.exists()) {
    System.err.println("File doesn't exist ==> " + archiveFile + "\n\n\n" + ERROR_MESSAGE);
    return;
}
```

输出形如：`File doesn't exist ==> /path/to/missing.apk` 并附完整 USAGE。

### 3️⃣ 未知 operand

operand 经 `.toLowerCase()` 后命中 `switch` 的 `default`：

```java
default:
    System.err.println("wrong operand ==> " + operand + "\n\n\n" + ERROR_MESSAGE);
```

输出形如：`wrong operand ==> -foo`，同样附 USAGE。

## ⚠️ 运行期异常捕获

`SilverGhostFacade` 与 `Exporter` 在导出流程内捕获异常，统一打印 `Internal error`：

| 触发点 | 源码片段 | stderr 输出 |
|--------|----------|-------------|
| `exportArchive` | `catch (Exception e)` 包裹 `Exporter.writeArchive` | `Internal error - couldn't write file` |
| `exportClassFromApk` 写文件 | `catch (Exception e)` 包裹 `Exporter.writeCurrentClass` | `Internal error - couldn't write file` |
| `exportClassFromApk` 翻译 | `catch (NullPointerException npe)` 包裹 `translator.apply()` | `Class doesn't exist in the writeArchive` |

::: warning 异常被吞
`Exporter.writeListStrings` / `writeListStringsChannel` 的 `catch (IOException ioe) {}` 是**空 catch**，磁盘写入失败时静默无输出。`writeMethodCounts` 的 `IOException` 仅 `ex.printStackTrace(System.err)`，不打印语义化错误。
:::

## 📊 常见错误信息速查

| stderr 信息 | 触发条件 | 触发位置 | 含义与建议 |
|-------------|----------|----------|-----------|
| `missing command line arguments` | `args.size() < 2` | `CliMode.with` | 至少要给 `operand` + `archive` 两个参数 |
| `File doesn't exist ==> <path>` | `new File(args.get(1)).exists() == false` | `CliMode.with` | 第二个参数路径不存在，检查拼写/相对路径 |
| `wrong operand ==> <op>` | operand 不在 `-export/-inspect/-methodcounts/-update` | `CliMode.with` switch default | 拼写错误或大小写不影响匹配（已小写化） |
| `Not an apk file ==> java -jar ClassyShark.jar -inspect APK_FILE` | `-inspect` 时文件名不以 `.apk` 结尾 | `SilverGhostFacade.inspectApk` | `-inspect` 仅支持 APK，换 `-export` 处理 jar/dex |
| `File '<name>' does not exist` | `-methodcounts` 时归档文件不存在 | `SilverGhostFacade.inspectPackages` | 方法计数路径校验，独立于 `CliMode` |
| `Class doesn't exist in the writeArchive` | `translator.apply()` 抛 `NullPointerException` | `exportClassFromApk` | 指定类名在归档中不存在 |
| `Internal error - couldn't write file` | `Exporter.writeArchive`/`writeCurrentClass` 抛任意 `Exception` | `exportArchive` / `exportClassFromApk` | 写盘失败：权限不足、磁盘满、路径不可写 |

## 🔍 脚本集成建议

由于无退出码区分，CI/CD 脚本应解析 `stderr`：

```bash
# 捕获 stderr 判断成败
err=$(java -jar ClassyShark.jar -inspect app.apk 2>&1 >/dev/null)
if [ -n "$err" ]; then
  echo "::error::ClassyShark 失败: $err"
  exit 1
fi
```

```bash
# 校验类是否存在的探测模式
out=$(java -jar ClassyShark.jar -export app.apk com.example.MyClass 2>&1 >/dev/null)
case "$out" in
  *"Class doesn't exist"*) echo "缺失目标类" ;;
  *"Internal error"*)     echo "写盘失败" ;;
  "")                     echo "成功" ;;
esac
```

::: tip USAGE 常量
`ERROR_MESSAGE` 在 `CliMode` 中为 `static final` 常量，所有参数类错误都会拼接同一段 USAGE 文本，可作为脚本匹配的稳定锚点。
:::

## 📚 相关文档

- [CLI 参考](/cli/index)
- [-export 导出](/cli/export)
- [-inspect 分析](/cli/inspect)
- [CliMode 模块参考](/reference/modules/CliMode)
