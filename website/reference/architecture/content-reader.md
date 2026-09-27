# 📥 内容读取子系统（ContentReader）

<Badge type="tip" text="架构" /> <Badge type="info" text="内容读取" />

> 内容读取子系统把**归档文件转换成"类名列表 + 组件"**。核心是 [`BinaryContentReader`](/reference/modules/BinaryContentReader) 接口，[`ContentReader`](/reference/modules/ContentReader) 按文件名扩展名路由到具体 Reader 实现，把 `load()` 的结果就地缓存。

## 一句话

`ContentReader` 是函数 `(二进制文件) → {contents: classnames, components}`——类名列表供 GUI 类树/搜索使用，组件（`Components`）标记 `ANDROID_MANIFEST` / `NATIVE_LIBRARY` 之类的归档要素。

## 扩展名 → Reader 路由

```mermaid
flowchart TD
    CR["new ContentReader(binaryArchive)<br/>（构造器内按扩展名选 reader）"] --> J{"archiveName 后缀?"}
    J -- ".jar" --> JR["JarReader"]
    J -- ".dex" --> DR["DexReader"]
    J -- ".apk" --> AR["ApkReader"]
    J -- ".aar" --> AAR["AarReader"]
    J -- 其它" --> CRd["ClazzReader<br/>（单 .class 兜底）"]
    JR & DR & AR & AAR & CRd --> BI["BinaryContentReader 接口<br/>read() / getClassNames() / getComponents()"]
```

| 扩展名 | Reader 实现 | 说明 |
|--------|------------|------|
| `.jar` | [`JarReader`](/reference/modules/JarReader) | 遍历 jar 条目 |
| `.dex` | [`DexReader`](/reference/modules/DexReader) | 单 dex 的类名 |
| `.apk` | [`ApkReader`](/reference/modules/ApkReader) | 解析多 dex + 组件标注 |
| `.aar` | [`AarReader`](/reference/modules/AarReader) | AAR 包 |
| `.class`（其它） | [`ClazzReader`](/reference/modules/ClazzReader) | 单类文件兜底 |
| 多 dex 场景 | [`MultidexReader`](/reference/modules/MultidexReader) | APK 内多个 `classes*.dex` 的汇总读取 |

> `ContentReader` 构造器把归档名 `toLowerCase()` 后逐一 `endsWith` 匹配；没有内置匹配的 `.class` 乃至任意文件一律落在 `ClazzReader`。

## 执行模型

```java
public void load() {
    if (allClassNames.isEmpty()) {        // 实例级缓存判空
        formatReader.read();               // 委托具体 reader 读盘
        allClassNames = formatReader.getClassNames();
    }
}
```

- **一次成型** — `load()` 的判空缓存意味着每个 `ContentReader` 实例至多读盘一次，重复调用零成本。
- **静默降级** — 读异常时置空列表，不向上抛；外层判空（如 [`SilverGhost.isArchiveError`](/reference/modules/SilverGhost)）据此识别坏归档。
- **只读暴露** — `getAllClassNames()` 返回不可变列表；`getAllComponents()` 直接透传 reader 的组件信息。

## 与上层关系

- [`SilverGhost`](/reference/architecture/silverghost) 持有 ContentReader 实例，三阶段编排的**第一阶段复用它拿类名**，并喂给 [`Reducer`](/reference/modules/Reducer) 做自动补全过滤。
- GUI 的类树、搜索、类名补全都消费同一份 `getAllClassNames()`。
- 混淆映射（TokensMapper）只作用于**翻译层**，不影响内容读取——类名列表始终是原始的。

## 设计要点

- 🧺 **统一契约** — 所有格式收敛到 `BinaryContentReader` 三方法，上层不感知格式差异。
- 🔀 **构造期路由** — 扩展名匹配发生在 `new ContentReader(...)` 的构造器里，`load()` 不再分支。
- 📦 **缓存即约定** — 读一次、缓存、只读暴露，配合 IO 层 [SherlockHash](/reference/modules/SherlockHash) 的 zip 提取缓存。

## 进一步阅读

- 🧩 [ContentReader](/reference/modules/ContentReader) · [BinaryContentReader](/reference/modules/BinaryContentReader) · [ApkReader](/reference/modules/ApkReader) · [DexReader](/reference/modules/DexReader) · [JarReader](/reference/modules/JarReader) · [AarReader](/reference/modules/AarReader) · [ClazzReader](/reference/modules/ClazzReader) · [MultidexReader](/reference/modules/MultidexReader)
- 📥 [内容读取模块纵深](/reference/architecture/contentreader) · ⚙️ [IO 层架构](/reference/architecture/io-layer)