# 🛠️ 教程：检查 Native 库

<Badge type="tip" text="教程" /> <Badge type="info" text="GUI · CLI" />

> 用两条路径审查 APK 里的 `.so`：GUI 类树选 `.so` 条目，看 [`ElfTranslator`](/reference/modules/ElfTranslator) 输出的 ELF 结构；`-inspect` 一键跑 [`DynamicSymbolsInspector`](/reference/modules/DynamicSymbolsInspector) 与 [`PrivateNativeLibsInspector`](/reference/modules/PrivateNativeLibsInspector)，把问题库标红。

## 🎯 你将学到

- 在 GUI 里读任意 `.so` 的文件大小、`DT_NEEDED` 依赖与动态符号
- 用 `-inspect` 找出**缺 SONAME / 有 text relocation** 的库
- 识别 **NDK 私有库**（`libandroid.so` 等 26 项 API 白名单之外却打进 APK 的库）——这是 Play Store 上架违规项
- 理解 ELF 32 位限制对 arm64 设备的影响

## 背景：`.so` 是什么

`.so`（Shared Object）是 Android 的 native 库格式，二进制 ELF。ClassyShark 不反汇编它，而是直接**解析 ELF 头与符号表**——所以看的是结构信息而非机器码。入门见 [ELF / .so 概念](/guide/concepts/elf-so)。

## 🖥️ 步骤 1：GUI 打开 APK，选 `.so` 条目

```text
启动 GUI
   java -jar ClassyShark.jar -open app.apk

在类树 / 搜索里定位 lib/arm64-v8a/libnative-lib.so
   → 路由到 ElfTranslator
   → DisplayArea 输出 ELF 结构
```

[`ElfTranslator`](/reference/modules/ElfTranslator) 输出三块：

```text
File size - 24.5 Kb

Native Dependencies            ← DT_NEEDED
    liblog.so
    libdl.so
    libm.so

Dynamic Symbols               ← 动态符号表
    --  __aeabi_memcpy
    --  __cxa_finalize
    --  Java_com_example_app_NativeLib_hello
    ...
```

| 区块 | 含义 | 来源 |
|------|------|------|
| `File size` | 解压后 `.so` 字节数 | `ElfTranslator.getElementsList()` |
| `Native Dependencies` | `DT_NEEDED` 依赖库列表 | `Elf.getSharedDependencies()` |
| `Dynamic Symbols` | 动态符号（含导出的 `Java_*` JNI 函数） | `ElfReader.getDynamicSymbols()` |

`ElfTranslator` 用 [`SherlockHash`](/reference/modules/SherlockHash) 把 `.so` 从 APK 里解出来缓存，同一库二次查看不再解压。

> GUI 里逐库翻依赖是找「**链接了不该链接的库**」最直接的方式——比如一个仅有 `Java_*` 入口的库突然依赖了 `libcrypto.so`，就该怀疑它内嵌了 SSL 栈。

## ⚙️ 步骤 2：`-inspect` 看每库检查结果

```bash
java -jar ClassyShark.jar -inspect app.apk
```

输出包含 native 检查区块（节选）：

```text
Native Error    lib/arm64-v8a/libbad.so -- private api!
Native Error    lib/armeabi-v7a/libnative-lib.so
```

`Native Error` 行来自 [`ApkDashboard`](/reference/modules/ApkDashboard) 的 `getPrivateLibErrorTag(nativeLib)`，背后是两个 Inspector：

### DynamicSymbolsInspector（ELF 合法性问题）

```java
if (!elf.isSoname())   { errors += " missing SONAME ";  }
if (elf.isTextRel())   { errors += " text relocations found "; }
```

| 检查 | 含义 | 后果 |
|------|------|------|
| 缺 SONAME | ELF 没有 `DT_SONAME` | 动态链接时无法按名称定位 |
| text relocation | 存在 text 段重定位 | Android 6+ 直接 `dlopen` 失败 |

两类都记入 `errors`，`areErrors()` 为真——它们也出现在 `-inspect` 的 Native Error 行里。

### PrivateNativeLibsInspector（NDK 私有库检查）

```java
if (!APIS_LIB_LIST.contains(nativeLib) && !nativeLibNames.contains(nativeLib)) {
    return true;   // private api!
}
```

判定：库名**不在 26 项 API 白名单**且**不是 APK 自带的其它 native 库** → 标记 `-- private api!`。

白名单镜像 NDK 官方公开 API 库，含 `libc.so`、`libm.so`、`libdl.so`、`liblog.so`、`libandroid.so`、`libEGL.so`、`libGLESv2.so`、`libOpenSLES.so`、`libvulkan.so`、`crtbegin_*.o` 等。**在应用里链接白名单之外的平台库**（如 `libcutils.so`、`libhardware.so`），属于 Play Store 隐私政策外的平台私有 API 使用，有下架风险。

| 输出 | 含义 |
|------|------|
| `Native Error  lib/.../libbad.so -- private api!` | 链接了非白名单私有库 |
| `Native Error  lib/.../libnative-lib.so` | ELF 结构问题（缺 SONAME / text rel） |
| （无 Native Error 行） | native 库干净 |

> 💡 两个 Inspector 入口不同但输出合流：`DynamicSymbolsInspector` 把问题塞进 `nativeErrors`，`PrivateNativeLibsInspector` 由 `getPrivateLibErrorTag` 驱动——`ApkDashboard.toString()` 把两类合并成同一行 `addRow(rows, "Native Error ", ...)`。

## ⚠️ 已知限制

- **仅 ELFCLASS32** — [`ElfReader`](/reference/modules/ElfReader) 在 `mClass != ELFCLASS32` 时抛 `IOException("Invalid executable type ... not ELFCLASS32!")`。现代 APK 里的 `arm64-v8a` 是 **64 位 `.so`**，`ElfTranslator` 解析会失败，GUI 显示空内容。排查 arm64 库请先用 `file` / `readelf` 确认位数，或换 32 位库（`armeabi-v7a`）验证链路。
- **看结构不看代码** — 只能读头部、依赖、符号表，不能反汇编 `.so` 指令。
- **`getElementsList` 静默吞异常** — `ElfTranslator.apply()` 的 `catch (Exception e) {}` 空捕获，解析失败时 `dependencies`/`dynamicSymbols` 保持空串，UI 只显示 `File size`——空输出不等于无问题。

## 📌 小结

| 场景 | 手段 | 看什么 |
|------|------|--------|
| 单库依赖与符号 | GUI 选 `.so` | File size / DT_NEEDED / 动态符号 |
| 全部库体检 | `-inspect APK` | Native Error 行 |
| 上架合规 | `-inspect` 的 `-- private api!` | 是否链接 NDK 白名单之外的平台库 |
| arm64 库 | 外部工具 `readelf -h` | 先确认 ELF 位数 |

## 🔗 相关文档

- 模块：[ElfTranslator](/reference/modules/ElfTranslator) · [ElfReader](/reference/modules/ElfReader) · [DynamicSymbolsInspector](/reference/modules/DynamicSymbolsInspector) · [PrivateNativeLibsInspector](/reference/modules/PrivateNativeLibsInspector) · [ApkDashboard](/reference/modules/ApkDashboard)
- 概念：[ELF / .so 是什么](/guide/concepts/elf-so) · [APK 结构](/guide/concepts/apk)
- CLI：[CLI 参考](/cli/index) · [-inspect](/cli/inspect)