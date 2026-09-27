# ❓ 常见问题 FAQ

<Badge type="tip" text="指南" /> <Badge type="info" text="FAQ" />

> 🦈 使用 ClassyShark 时最常遇到的 10 个问题，一句话回答 + 深入链接。

## 📋 问题速查

| # | 问题 | 关键词 |
|---|------|--------|
| 1 | 如何打开一个 APK？ | `-open` / 拖拽 |
| 2 | 方法数怎么看？ | `-methodcounts` / 环形图 |
| 3 | 支持 `.so` 原生库吗？ | ELF，仅 32 位 |
| 4 | 能反混淆吗？ | ProGuard mapping |
| 5 | `.zip` 为何行为异常？ | 已知限制 |
| 6 | 如何导出数据？ | `-export` |
| 7 | 能作为库嵌入吗？ | Shark API |
| 8 | 需要装 Android SDK 吗？ | 纯 Java，不需要 |
| 9 | 深色主题怎么切？ | 设置，下次启动生效 |
| 10 | 统计上报能关吗？ | Analytics 说明 |

---

## 1️⃣ 如何打开一个 APK？ 📦

两种方式任选其一：

- **GUI**：启动 `java -jar ClassyShark.jar` 后，把 APK 文件**拖进窗口**即可加载。
- **CLI**：用 `-open` 参数直接指定文件路径：

```bash
java -jar ClassyShark.jar -open app.apk
```

> 📖 详见 [GUI 参考](/gui/index) 与 [CLI 参考](/cli/index)。

## 2️⃣ 方法数怎么看？ 📊

- **CLI**：用 `-methodcounts`，可选 `-flat` 改为扁平输出：

```bash
java -jar ClassyShark.jar -methodcounts app.apk          # 树形
java -jar ClassyShark.jar -methodcounts app.apk -flat    # 扁平
```

- **GUI**：加载 APK 后查看窗口**底部的环形图**，按包可视化方法数分布。

> 📖 详见 [CLI 参考](/cli/index)。底层方法签名采集见 [Shark API](/api/shark-class) 的 `getAllMethods()`。

## 3️⃣ 支持 `.so` 原生库吗？ 🧩

✅ 支持，但**仅限 32 位 ELF**。`TranslatorFactory` 中 `.so` 分支交给 `ElfTranslator` 处理：

```java
if (className.endsWith(".so")) {
    return new ElfTranslator(className, archiveFile);
}
```

⚠️ 已知限制：64 位 ELF / ARM64 解析能力有限，复杂 `.so` 可能显示不全。

> 📖 详见 [TranslatorFactory 模块](/reference/modules/TranslatorFactory) 与 [支持格式](/guide/supported-formats)。

## 4️⃣ 能反混淆吗？ 🛠️

部分支持。ClassyShark 自身不内置 ProGuard 还原，但你可以**加载外部的 ProGuard `mapping.txt`**（通过 GUI 的对应菜单项），将混淆后的类名/方法名映射回原始符号。

⚠️ 仅做**静态名映射**，不还原控制流或去混淆逻辑。

## 5️⃣ `.zip` 为何行为异常？ ⚠️

这是**已知限制**。看 `TranslatorFactory.createTranslator()` 的扩展名分发链：

```java
.xml → AndroidXmlTranslator
.dex → DexInfoTranslator
.jar → JarInfoTranslator
.apk → ApkTranslator
.so  → ElfTranslator
（其他）→ JavaTranslator
```

❌ **没有 `.zip` 分支**。`.zip` 会落到末尾的 `JavaTranslator`（按单类处理），因此无法像 APK 那样列出归档内全部类。建议改用 `.apk` / `.jar`，或先解压再单独检查条目。

> 📖 详见 [TranslatorFactory 模块](/reference/modules/TranslatorFactory)。

## 6️⃣ 如何导出数据？ 📦

用 `-export` 命令，导出 manifest、类名、方法、字符串、方法计数到文本：

```bash
java -jar ClassyShark.jar -export app.apk                              # 全量
java -jar ClassyShark.jar -export app.apk com.bumptech.glide.Target   # 单类
```

> 📖 详见 [CLI 参考](/cli/index) 与 [快速开始](/guide/quick-start)。

## 7️⃣ 能作为库嵌入自己的项目吗？ 🚀

✅ 可以。把 `ClassyShark.jar` 加入 classpath，用 `Shark` facade 编程访问：

```java
Shark shark = Shark.with(new File("app.apk"));
shark.getGeneratedClass();     // 反编译单个类
shark.getAllClassNames();       // 全部类名
shark.getManifest();           // AndroidManifest 文本
shark.getAllMethods();          // 所有方法签名
shark.getAllStrings();          // 所有字符串常量
shark.isMultiDex();             // 是否 multidex
shark.isCustomMultiDex();       // 是否自定义 multidex
```

> 📖 详见 [Shark API](/api/shark-class) 与 [快速开始 · 作为库使用](/guide/quick-start#作为库使用)。

## 8️⃣ 需要装 Android SDK 吗？ 🖥️

❌ **不需要**。ClassyShark 是**纯 Java**应用，`sourceCompatibility = 1.8`，只要本机有 **JDK 8+** 即可运行，与 Android SDK 无任何耦合。

> 📖 详见 [安装指南](/guide/installation)。

## 9️⃣ 深色主题怎么切？ 🌙

GUI 中进入 **设置 → 主题** 选择深色/浅色。⚠️ 主题切换**下次启动后生效**（运行中不实时切换）。底层由 `Theme` 支持类管理。

> 📖 详见 [GUI 参考](/gui/index)。

## 🔟 统计上报能关吗？ 📊

ClassyShark 内置 `Analytics`（基于 jgoogleanalytics），在启动时向 Google Analytics 发送一次匿名「Activation」事件：

```java
tracker = new JGoogleAnalyticsTracker(
    "ClassyShark-Activation", version, "UA-91889970-1");
tracker.trackAsynchronously(focusPoint);
```

⚠️ **源码层面无开关可关**。如需彻底禁用，可：
- 防火墙拦截对 Google Analytics 域名的出站请求；或
- 自行从源码移除 `Analytics.INSTANCE.addActivation()` 调用后重新构建。

> 📖 详见 [Analytics 模块](/reference/modules/Analytics)。上报仅含匿名激活计数，不含 APK 内容。

---

## 🦈 还没解决？

- 📖 翻 [架构总览](/guide/architecture-overview) 理解整体设计；
- 🔍 查 [模块文档](/reference/modules/Main) 定位具体类行为；
- 🧩 看 [支持格式](/guide/supported-formats) 确认文件类型。
