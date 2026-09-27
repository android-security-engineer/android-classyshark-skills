# 📋 教程：检查 AndroidManifest

<Badge type="tip" text="Manifest 检查" /> <Badge type="info" text="GUI · CLI · Shark API" />

> 三种姿势拿到 APK 的 `AndroidManifest.xml` 并发现后台不安全广播：GUI 搜索框路由、`-inspect` 仪表盘建议、`Shark.getManifest()` 编程取。三者最终都落到 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator) 解二进制 XML 的同一套逻辑。

## 🎯 你将学到

- 用 GUI 输入框把 `AndroidManifest.xml` 路由到清单显示
- 用 `-inspect` 一键拿到 Manifest 建议（后台不安全 `ReceiverActionsBL`、Android O 隐式广播白名单）
- 用 `Shark.getManifest()` 编程取出明文清单
- 理解 `ManifestInspector → AndroidManifestPlainTextReader（JAXP XPath）→ ReceiverActionsBL` 的检查链路

## 调用链总览

```mermaid
flowchart LR
    U["你（GUI / CLI / 代码）"] --> AF["SilverGhostFacade.getManifest(apk)\n或 Shark.getManifest()"]
    AF --> AXT["AndroidXmlTranslator\n二进制 XML → 明文"]
    AXT --> MI["ManifestInspector.getInspections()"]
    MI --> AMPR["AndroidManifestPlainTextReader\nJAXP DOM + XPath 解析"]
    AMPR --> RBL["ReceiverActionsBL\n过滤后台不安全动作"]
    RBL --> OUT["action ==> receiver 列表"]
```

## 🖥️ 步骤 1：GUI 搜索框路由到清单

打开 APK 后，ClassyShark 顶部 [`Toolbar`](/reference/modules/Toolbar) 输入框即「跳转路由」。输入 `AndroidManifest.xml -`（注意结尾的 ` -`，含空格与短横线），路由键命中后，[`ClassySharkPanel`](/reference/modules/ClassySharkPanel) 调 `silverGhost.translateArchiveElement("AndroidManifest.xml")`，由 [`TranslatorFactory`](/reference/modules/TranslatorFactory) 选出 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator)，把二进制 XML 解成纯文本显示在右侧 [`DisplayArea`](/reference/modules/DisplayArea)。

> 路由常量 `ANDROID_MANIFEST_XML_SEARCH = "AndroidManifest.xml - "` 定义在 `ClassySharkPanel`，前缀 `AndroidManifest.xml` 是归档内条目名，尾部 ` -` 用于与同名类区分。

```text
启动 GUI
   java -jar ClassyShark.jar -open app.apk

输入框键入：AndroidManifest.xml -
   → 命中 ANDROID_MANIFEST_XML_SEARCH
   → translateArchiveElement("AndroidManifest.xml")
   → AndroidXmlTranslator.apply() 解二进制 XML
   → DisplayArea 显示明文清单
```

| GUI 操作 | 背后调用 |
|---------|---------|
| 顶部输入框输 `AndroidManifest.xml -` | `ClassySharkPanel` 路由匹配常量 |
| 命中后回车 | `silverGhost.translateArchiveElement("AndroidManifest.xml")` |
| 选中清单显示 | `TranslatorFactory.createTranslator("AndroidManifest.xml", archive)` → `AndroidXmlTranslator` |

适合**人工通读**整份清单；要机器化建议，看下一步。

## ⚙️ 步骤 2：`-inspect` 看 Manifest 建议

`-inspect`（入口 [`CliMode`](/reference/modules/CliMode) → `SilverGhostFacade.inspectApk`）打印 APK 分析仪表盘，其中「System Broadcast」区块即 Manifest 建议：

```bash
java -jar ClassyShark.jar -inspect app.apk
```

输出形如（节选）：

```text
Recommendation      Description
System Broadcast    android.intent.action.SOME_BROADCAST ==> com.example.MyReceiver
System Broadcast    com.google.android.someservice.SOME_ACTION ==> com.example.AnotherReceiver
```

这些行来自 [`ApkDashboard`](/reference/modules/ApkDashboard).`getManifestRecommendations()` → [`ManifestInspector`](/reference/modules/ManifestInspector).`getInspections()`。流程：

1. [`ManifestInspector`](/reference/modules/ManifestInspector) 经 facade 取 manifest 明文
2. [`AndroidManifestPlainTextReader`](/reference/modules/AndroidManifestPlainTextReader) 用 JAXP `DocumentBuilder` 解析 DOM，XPath `/manifest/application/receiver/intent-filter/action` 取 action→receiver 映射
3. [`ReceiverActionsBL`](/reference/modules/ReceiverActionsBL) 过滤：动作**不在 Android 批准白名单**且以 `com.google.` 或 `android.` 系统前缀开头，视为 Android O+ 后台不安全隐式广播

### 白名单何来？

[`ReceiverActionsBL`](/reference/modules/ReceiverActionsBL) 的 `approvedActions` 镜像 Android 官方「后台执行限制」隐式广播例外（如 `BOOT_COMPLETED`、`USB_DEVICE_ATTACHED`、`LOGIN_ACCOUNTS_CHANGED` 等）。不在白名单的系统级隐式广播，在 Android O+ 会因后台限制而失效，正是 `-inspect` 要提醒你的。

| 输出含义 | 来源 |
|---------|------|
| `action ==> receiver` | [`ReceiverActionsBL.getBGActionsList()`](/reference/modules/ReceiverActionsBL) 格式化 |
| 「System Broadcast」行标题 | `ApkDashboard.toString()` 的 `addRow(rows, "System Broadcast ", ...)` |
| 过滤掉的非系统动作 | 不以 `com.google.`/`android.` 开头，直接丢弃 |

## 🧩 步骤 3：`Shark.getManifest()` 编程取

需要在自己代码里拿明文清单？用 Shark API：

```java
import com.google.classyshark.Shark;

Shark shark = Shark.with(new File("app.apk"));

// 取解压后的明文 AndroidManifest
String manifest = shark.getManifest();
System.out.println(manifest);

// 顺手做检查（与 -inspect 同源）
// getManifest() 返回的就是 AndroidXmlTranslator.toString() 的结果
```

`Shark.getManifest()` 内部直调 `SilverGhostFacade.getManifest(archiveFile)`，对 `.apk` 用 [`TranslatorFactory`](/reference/modules/TranslatorFactory) 建 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator)，`translator.apply()` 解二进制 XML 后 `toString()` 返回明文。

| Shark API | 等价 facade | 说明 |
|-----------|-----------|------|
| `Shark.with(file).getManifest()` | `SilverGhostFacade.getManifest(file)` | 明文清单（仅 `.apk`，否则返回 `""`） |
| `Shark.with(file).getAllClassNames()` | `SilverGhostFacade.getAllClassNames` | 归档内类/条目名 |
| `Shark.with(file).isMultiDex()` | `SilverGhostFacade.isMultiDex` | 是否多 dex |

> 想在自己的代码里复刻 `-inspect` 的 Manifest 建议？把 `shark.getManifest()` 喂给 `new AndroidManifestPlainTextReader(manifest).getActionsWithReceivers()`，再过 `new ReceiverActionsBL(actions).getBGActionsList()` 即可——这正是 [`ManifestInspector`](/reference/modules/ManifestInspector) 的内部三步。

## 📌 小结与选型

| 场景 | 推荐方式 | 产物 |
|------|---------|------|
| 人工通读清单 | GUI 输入 `AndroidManifest.xml -` | 明文清单显示 |
| 一键安全建议 | `-inspect APK` | 后台不安全广播列表 |
| 编程集成 | `Shark.with(file).getManifest()` | 明文字符串 |

三种入口的**明文来源**都是 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator)（二进制 XML → 纯文本），**检查链路**统一收敛到 [`ManifestInspector`](/reference/modules/ManifestInspector) → [`AndroidManifestPlainTextReader`](/reference/modules/AndroidManifestPlainTextReader)（JAXP XPath）→ [`ReceiverActionsBL`](/reference/modules/ReceiverActionsBL)。

## ⚠️ 已知限制

- [`ReceiverActionsBL`](/reference/modules/ReceiverActionsBL) 只认 `com.google.` 与 `android.` 前缀；第三方 ROM 系统前缀（如 `com.miui.`）不会被标记。
- [`AndroidManifestPlainTextReader`](/reference/modules/AndroidManifestPlainTextReader) 用绝对 XPath（`/manifest/application/receiver/...`），manifest 结构稍异即取不到节点，且解析异常静默返回空——空结果未必等于「无问题」。
- `getManifest()` 对非 `.apk`（如 `.aar`）返回 `""`，aar 内 XML 虽未二进制化但走不同分支，需用 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator) 的 `.aar` 文本路径。

## 🔗 相关文档

- 模块：[ManifestInspector](/reference/modules/ManifestInspector) · [AndroidManifestPlainTextReader](/reference/modules/AndroidManifestPlainTextReader) · [ReceiverActionsBL](/reference/modules/ReceiverActionsBL) · [AndroidXmlTranslator](/reference/modules/AndroidXmlTranslator)
- CLI：[CLI 参考](/cli/index) · [-inspect](/cli/inspect)
- API：[Shark API](/api/index)
- 指南：[什么是 ClassyShark](/guide/what-is-classyshark)
