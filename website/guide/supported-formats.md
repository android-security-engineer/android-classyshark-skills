# 📋 支持的格式

<Badge type="tip" text="指南" /> <Badge type="info" text="参考" />

ClassyShark 支持浏览多种 Android 相关二进制格式。下表列出每种格式的处理路径。

## 归档与可执行格式

| 格式 | 扩展名 | ContentReader | Translator | 底层库 | 说明 |
|------|--------|---------------|-----------|--------|------|
| 📦 APK | `.apk` | ApkReader | ApkTranslator → ApkDashboard | dexlib2 + ASM + asmdex | 完整应用包，含依赖检查仪表盘 |
| 🧩 DEX | `.dex` | DexReader | DexInfoTranslator | dexlib2 | Dalvik 字节码，单/多 dex |
| ☕ JAR | `.jar` | JarReader | JarInfoTranslator | java.util.jar | Java 库摘要 |
| 📦 AAR | `.aar` | AarReader | JavaTranslator | java.util.jar | Android 库，提取内嵌 classes.jar |
| 🐚 SO | `.so` | （组件） | ElfTranslator | java-binutils + 自研 ElfReader | native 共享库，动态符号 |
| ☕ CLASS | `.class` | ClazzReader | JavaTranslator | ASM | 单个 Java 类文件 |

## 二进制 XML 格式

| 格式 | 来源 | Translator | 说明 |
|------|------|-----------|------|
| 📄 AndroidManifest.xml | APK 内 | AndroidXmlTranslator | 应用清单 |
| 📄 布局 XML | APK 内 res/ | AndroidXmlTranslator | 编译后的布局 |
| 📄 资源 XML | APK 内 | AndroidXmlTranslator | 编译后的资源 |

二进制 XML 经独立的 [`XmlDecompressor`](/reference/modules/XmlDecompressor) 解码——这是 ClassyShark 不依赖 AOSP `aapt` 的自研实现。

## ⚠️ 已知限制

- **`.zip` 格式**：[`FileChooserUtils`](/reference/modules/FileChooserUtils) 的文件选择器与拖放接受 `.zip`，但 [`TranslatorFactory`](/reference/modules/TranslatorFactory) 没有 `.zip` 分支，`.zip` 会落入默认 `JavaTranslator`，行为可能不符合预期。详见 [TranslatorFactory 已知问题](/reference/modules/TranslatorFactory)。
- **ELF 64 位**：[`ElfReader`](/reference/modules/ElfReader) 仅支持 `ELFCLASS32`，遇 64 位会抛 `ELFCLASS64`。Android `armeabi-v7a` 的 `.so` 是 32 位；`arm64-v8a` 的 `.so` 是 64 位。

## 进一步阅读

- 🏗️ [架构总览](./architecture-overview)
- 🧩 [ContentReader 架构](/reference/architecture/contentreader)
- 🧩 [Translator 架构](/reference/architecture/translator)
