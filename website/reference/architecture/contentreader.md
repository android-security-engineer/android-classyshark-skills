# 📥 ContentReader 解析引擎

<Badge type="tip" text="架构" /> <Badge type="info" text="内容读取" />

> `com.google.classyshark.silverghost.contentreader` 包把「任意二进制归档」统一解析成**类名列表 + 归档组件**。核心是 [ContentReader](/reference/modules/ContentReader) 按**归档扩展名**路由到具体 Reader，所有 Reader 收敛到同一个 [BinaryContentReader](/reference/modules/BinaryContentReader) 策略接口。解析与翻译彻底分层——内容层只回答「包里有什么」，语义交给 [Translator 架构](/reference/architecture/translator)。

## 扩展名 → Reader 路由

`new ContentReader(binaryArchive)` 在**构造器内**把文件名 `toLowerCase()` 后逐段 `endsWith` 匹配，`load()` 时不再分支：

```mermaid
flowchart TD
    CR["new ContentReader(file)"] --> E{"归档名后缀?"}
    E -- ".apk" --> APK["ApkReader"]
    APK --> MD["MultidexReader<br/>扫描 zip 条目"]
    E -- ".dex" --> DEX["DexReader"]
    DEX --> DL["DexlibLoader.loadDexFile"]
    E -- ".jar" --> JAR["JarReader"]
    JAR --> JIS["JarInputStream 扫 .class 条目"]
    E -- ".aar" --> AAR["AarReader"]
    AAR --> AEX["提取内嵌 jar → JarReader"]
    E -- 其它（含 .class）" --> CLZ["ClazzReader"]
    CLZ --> CV["ASM ClassNameVisitor"]
    APK & DEX & JAR & AAR & CLZ --> BI["BinaryContentReader 接口"]
    BI --> OUT["类名列表 + Components"]
```

| 扩展名 | Reader | 底层技术 | 说明 |
|--------|--------|----------|------|
| `.apk` | [ApkReader](/reference/modules/ApkReader) | [MultidexReader](/reference/modules/MultidexReader) | 委托多 dex 扫描，含组件标注 |
| `.dex` | [DexReader](/reference/modules/DexReader) | dexlib2 `DexlibLoader` | 类名转换：`replaceAll("/", ".")` 并去首尾括号 |
| `.jar` | [JarReader](/reference/modules/JarReader) | `JarInputStream` | 遍历 `.class` 条目 + native lib 组件 |
| `.aar` | [AarReader](/reference/modules/AarReader) | 解 jar → JarReader | 提取内嵌 `classes.jar` 委托 JarReader，有 manifest 则补标组件 |
| 其它 / `.class` | [ClazzReader](/reference/modules/ClazzReader) | ASM `ClassReader.accept` | 单类文件兜底，未知扩展名也落这里 |

## 统一策略接口：BinaryContentReader

所有 Reader 实现同一三方法接口，上层不感知格式差异：

| 方法 | 语义 |
|------|------|
| `read()` | 读盘、解析，填充内部状态 |
| `getClassNames()` | 返回类名列表（GUI 类树/搜索的唯一数据源） |
| `getComponents()` | 返回归档组件列表 |

## 输出契约：类名 + 组件

```java
public static class Component {
    String name;              // 组件名，如 "AndroidManifest.xml"、"lib/arm64-v8a/libnative.so"
    ARCHIVE_COMPONENT component; // 组件类型
}
public enum ARCHIVE_COMPONENT { ANDROID_MANIFEST, NATIVE_LIBRARY }
```

组件是解析层的**副产品标注**：manifest 与 native 库除了在类名列表里出现，还会单独标类型，供 GUI 分栏展示。

## load() 的实例级缓存

```java
public void load() {
    if (allClassNames.isEmpty()) {   // 判空即缓存
        formatReader.read();
        allClassNames = formatReader.getClassNames();
    }
}
```

- **一次成型** — 每个 `ContentReader` 实例至多读盘一次，重复调用零成本。
- **静默降级** — 读异常时置空列表不抛错，上层判空识别坏归档。
- **只读暴露** — `getAllClassNames()` 返回不可变列表。

## 各 Reader 要点

- **ApkReader → MultidexReader** — 扫描 APK zip 条目：`.xml` 条目直接作为类名；`.dex` 用 [SherlockHash](/reference/modules/SherlockHash) 提取后交给 `DexReader.readClassNamesFromDex`；`lib/` 条目标 `NATIVE_LIBRARY`；`jar/zip` 条目递归处理内层 zip。
- **DexReader** — 类名从 `classDef.getType()` 出发，`/`→`.` 并去掉首 `L` 尾 `;`，得到标准 JVM 类名。
- **JarReader** — `JarInputStream` 逐条目，`.class` 名直接入库。⚠️ 源码中的 native 组件匹配有 bug（`startsWith("resources") && startsWith(".so")` 不可能同时成立，带 TODO），实际只靠类名条目。
- **AarReader** — 把内嵌 `classes.jar` 解到临时文件再委托 JarReader，实现「AAR ≈ 增强版 JAR」的复用。
- **ClazzReader** — `Files.readAllBytes` + ASM `ClassReader.accept(new ClassNameVisitor(), 0)`，从字节码头读类名，兜底任意未知格式。

## 与上层关系

- [SilverGhost](/reference/modules/SilverGhost) 三阶段编排的**阶段 1** 持 `ContentReader` 拿类名，喂给 [Reducer](/reference/modules/Reducer) 做自动补全。
- 混淆映射（TokensMapper）只作用于翻译层，**不影响**内容读取——类名列表始终是原始名。
- [SherlockHash](/reference/modules/SherlockHash) 的 zip 提取缓存在 `MultidexReader` 内被复用，避免重复解压同一条目。

## 设计要点

- 🧺 **统一契约** — 全格式收敛到 `BinaryContentReader` 三方法，上层零分支。
- 🔀 **构造期路由** — 扩展名匹配发生在构造器，`load()` 是纯执行，职责单一。
- 📦 **缓存即约定** — 读一次、缓存、只读暴露，配合 IO 层提取缓存。
- 🧩 **兜底 ClazzReader** — 未知格式一律当单类解析，保证「什么文件都能开」。

## 进一步阅读

- 🧩 [ContentReader](/reference/modules/ContentReader) · [BinaryContentReader](/reference/modules/BinaryContentReader) · [ApkReader](/reference/modules/ApkReader) · [DexReader](/reference/modules/DexReader) · [JarReader](/reference/modules/JarReader) · [AarReader](/reference/modules/AarReader) · [ClazzReader](/reference/modules/ClazzReader) · [MultidexReader](/reference/modules/MultidexReader)
- 🏗️ [SilverGhost 引擎](/reference/architecture/silverghost-engine) · [翻译器架构](/reference/architecture/translator) · [IO 层架构](/reference/architecture/io-layer)
- 📚 [内容读取 SPI](/api/contentreader-spi) · [概念：multidex](/guide/concepts/multidex) · [概念：dex](/guide/concepts/dex)
