# 📚 术语表

<Badge type="tip" text="指南" /> <Badge type="info" text="术语表" />

> 阅读 ClassyShark 文档时常遇到的名词速查。每条 1-2 句，附上在源码中的落点或相关概念链接，便于按图索骥。🦈

## 📦 Android 交付与格式

| 术语 | 解释 |
|------|------|
| **APK** | Android Package，Android 应用的发布归档。本质是 ZIP，内含 `classes*.dex`、二进制 XML（`AndroidManifest.xml`、资源）、`lib/` 下 native `.so` 等。ClassyShark 的 `ApkReader` 按归档方式遍历它。 |
| **AAR** | Android Archive，Android 库的发布格式（ZIP）。内嵌 `classes.jar` + `R.txt` + `AndroidManifest.xml` + native 库。`AarReader` 先抽出内嵌 jar，再交给 `JarReader`。 |
| **JAR** | Java Archive，标准 JVM 字节码归档。`JarReader` 用 `java.util.jar` 遍历，`JarInfoTranslator` 给出类计数 + 文件大小摘要。 |
| **DEX** | Dalvik EXecutable，Android 字节码格式。单个 DEX 方法 ID 用 16 位索引，上限 65535。详见 [DEX 与 Dalvik](./concepts/dex)。 |
| **Multidex** | 方法数超 65k 时构建系统拆出 `classes.dex`、`classes2.dex`… 多 DEX 方案。`SilverGhostFacade.isMultiDex` 检测 ≥2 个 dex；`isCustomMultiDex` 检测自定义加载（`classes1.dex` 或非 `classes` 前缀）。 |
| **65k 限制** | 单 DEX 方法 ID 仅 16 位，最多 65535 个方法（含依赖）。超限即必须 multidex，是 ClassyShark 方法数统计的核心痛点。 |

## ⚙️ 运行时与 native

| 术语 | 解释 |
|------|------|
| **Dalvik** | Android 早期基于寄存器的虚拟机，运行 DEX。已被 ART 取代，但 DEX 格式沿用至今。 |
| **ART** | Android Runtime，Dalvik 的继任者（5.0 起），支持 AOT/JIT 混合编译，仍消费 DEX 字节码。 |
| **ELF** | Executable and Linkable Format，`.so` native 库的容器格式。`ElfTranslator` 用 java-binutils 解析它，输出依赖的 `.so` 列表与动态符号。 |
| **SONAME** | Shared Object NAME，ELF 的 `DT_SONAME` 字段，记录库的标准名。`DynamicSymbolsInspector` 在 SONAME 缺失时会标记 `"missing SONAME"`，提示 native 打包不规范。 |
| **NDK** | Android Native Development Kit，用 C/C++ 构建 `.so` 的工具链。ClassyShark 的 native 依赖检查面向 NDK 产物。 |

## 🧩 二进制资源与清单

| 术语 | 解释 |
|------|------|
| **二进制 XML** | APK 内的 XML（`AndroidManifest.xml`、布局、资源）以二进制 chunk 形式存储，非文本。`AndroidXmlTranslator` 经 `XmlDecompressor` 还原为可读文本，详见 [支持的格式](./supported-formats)。 |
| **ResourceTypes** | AOSP 的 `ResourceTypes.h/.cpp` 定义了二进制 XML 的 chunk 与字符串池结构。`XmlDecompressor` 直接移植这套结构（`RES_TYPE_ATTRIBUTE` 等常量），是反压缩的理论基础。 |
| **Manifest** | `AndroidManifest.xml`，声明包名、组件、权限。ClassyShark 经 `SilverGhostFacade.getManifest` 返回其文本形式，是 APK 分析的入口。 |
| **Receiver** | Android 广播接收器组件，清单中以 `<receiver>` 声明。分析清单时常关注其 `exported` 与 IntentFilter 配置。 |
| **隐式广播** | 通过 IntentFilter 接收、非定向投递的广播（如 `BOOT_COMPLETED`）。从安全审计角度，exported 的隐式广播 Receiver 往往是攻击面。 |

## 🛠️ 构建与字节码处理

| 术语 | 解释 |
|------|------|
| **ProGuard** | Android 历史混淆/压缩工具，输出 `mapping.txt`。ClassyShark 通过 `TokensMapper` SPI 接入反混淆。 |
| **R8** | Google 新一代收缩/混淆器（替代 ProGuard），同样产出 mapping 文件，与 ProGuard 兼容。 |
| **混淆** | 将类/方法名替换为短名（`a`、`b`）以减小体积并增加逆向难度的处理。ClassyShark 负责把混淆后的字节码渲染成可读存根。 |
| **反混淆** | 依据 `mapping.txt` 把混淆名映射回原始名的逆操作。默认 `IdentityMapper` 不映射；接入自定义 `TokensMapper` 即可还原，见 [TokensMapper 模块](/reference/modules/TokensMapper)。 |
| **Accessors（合成访问器）** | 编译器为私有字段跨类访问生成的 `access$xxx` 静态方法（如内部类访问外部类私有字段）。`ClassesDexDataEntry.syntheticAccessors` 显式统计它们，常被当作混淆/体积评估指标。 |

## 🧱 字节码库

| 术语 | 解释 |
|------|------|
| **ASM** | OW2 的 JVM 字节码操作框架。`ClazzReader` 用它遍历 `.class`，`MetaObjectFactory` 也提供 ASM 策略渲染类源码存根。 |
| **dexlib2** | smali 项目（JesusFreke）的 DEX 读写库。`DexlibLoader` 用固定 API level 19 opcode 集加载 dex，`MultidexReader`、`DexReader` 均依赖它。 |
| **asmdex** | OW2 的 DEX 字节码框架。`DexMethodsDumper` 用它转储所有方法签名。 |
| **BCEL** | Apache Commons Byte Code Engineering Library。ClassyShark 在部分字节码分析场景使用它作为 ASM 的补充。 |

## 🏗️ 设计模式与架构

| 术语 | 解释 |
|------|------|
| **SPI** | Service Provider Interface，服务提供者接口。ClassyShark 暴露 `TokensMapper`（符号重映射）与 `FullArchiveReader`（自定义归档读取）两个插件插槽，详见 [Plugins SPI](/reference/architecture/plugins-spi)。 |
| **Facade** | 门面模式，为复杂子系统提供精简调用接口。`SilverGhostFacade`/`SilverGhost` 封装解析+翻译引擎；`Shark` 是面向工具链的编程 facade，见 [Shark 模块](/reference/modules/Shark)。 |
| **Decorator** | 装饰器模式，在不改原对象前提下动态叠加职责。ClassyShark 在 reader/translator 层用装饰组合（如 `AarReader` 装饰 `JarReader`、`MultidexReader` 装饰 `DexReader`）来叠加归档处理能力。 |
| **Null Object** | 空对象模式，用「什么都不做」的实现替代 `null`，避免空检查。`EmptyFullArchiveReader`（空 `readAsyncArchive`）与 `IdentityMapper`（恒等映射）即此模式的默认 SPI 占位实现。 |

## 🚀 进一步阅读

- 🧩 [DEX 与 Dalvik](./concepts/dex)
- 📋 [支持的格式](./supported-formats)
- 🏗️ [架构总览](./architecture-overview)
- 🧩 [Plugins SPI](/reference/architecture/plugins-spi)
- 📖 [CLI 参考](/cli/index)
