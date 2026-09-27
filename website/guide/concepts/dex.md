# 🧩 DEX 与 Dalvik

<Badge type="tip" text="概念" />

> DEX（Dalvik EXecutable）是 Android 应用的字节码格式，是 ClassyShark 最核心的分析对象之一。

## 什么是 DEX

Java/Kotlin 源码经 `javac`/`kotlinc` 编译成 JVM `.class` 字节码，再经 `d8`/`dx` 转换成 **DEX** 字节码，供 Dalvik / ART 虚拟机执行。一个 DEX 文件包含：

- 📋 字符串池（string pool）
- 🏷️ 类型表（type table）
- 🧬 原型表（proto table）
- 📁 字段表（field table）
- ⚙️ 方法表（method table）
- 📦 类定义（class def）

## 65k 方法数限制

单个 DEX 文件的方法 ID 用 16 位整数索引，**上限 65535 个方法**。一旦应用（含依赖）方法数超限，必须拆成多个 DEX（multidex）。这是 ClassyShark 方法数统计功能要解决的核心痛点。

详见 [方法数 65k 限制](./method-counts-65k) 与 [统计方法数教程](/tutorials/count-methods)。

## ClassyShark 如何解析 DEX

| 组件 | 职责 |
|------|------|
| [`DexlibLoader`](/reference/modules/DexlibLoader) | 用 smali/dexlib2 加载 dex（固定 API level 19 opcode 集） |
| [`DexReader`](/reference/modules/DexReader) | 遍历 `ClassDef`，把 VM 类型签名 `Lcom/foo/Bar;` 转成点分名 |
| [`MultidexReader`](/reference/modules/MultidexReader) | 扫描 APK 内所有 `classes*.dex`，按需提取 |
| [`DexInfoTranslator`](/reference/modules/DexInfoTranslator) | 选中某个 dex 时展示计数摘要 + 原生方法类 |
| [`DexMethodsDumper`](/reference/modules/DexMethodsDumper) | 转储所有方法签名（用 asmdex 遍历） |
| [`DexStringsDumper`](/reference/modules/DexStringsDumper) | 转储字符串常量池 |

## Multidex

当方法数超 65k，构建系统生成 `classes.dex`、`classes2.dex`、`classes3.dex`…… ClassyShark 的 [`SilverGhostFacade.isMultiDex`](/reference/modules/SilverGhostFacade) 检测是否存在 ≥2 个 dex；`isCustomMultiDex` 检测是否使用自定义 dex 加载（含 `classes1.dex` 或非 `classes` 前缀的 dex）。详见 [Multidex 概念](./multidex)。

## 进一步阅读

- 🧩 [APK 结构](./apk)
- 🧩 [Multidex](./multidex)
- 🧩 [反射 vs ASM vs dexlib2](./reflect-vs-asm-vs-dexlib)
