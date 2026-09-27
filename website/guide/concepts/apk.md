# 📦 APK 结构

<Badge type="tip" text="概念" />

> APK 是 Android 应用的发布包，本质是一个 ZIP，内含 DEX、资源、native 库与 Manifest。

## APK 内部结构

```
app.apk
├── AndroidManifest.xml        📄 二进制 XML（应用清单）
├── classes.dex                🧩 Dalvik 字节码（可能多个 classes2.dex…）
├── classes2.dex
├── resources.arsc             📊 编译后的资源表
├── res/                        📄 编译后的二进制 XML（布局等）
├── assets/                     📦 原始资源
├── lib/
│   ├── armeabi-v7a/
│   │   └── libfoo.so          🐚 32 位 native 库
│   └── arm64-v8a/
│       └── libfoo.so          🐚 64 位 native 库
└── META-INF/                   🔏 签名
```

## ClassyShark 的 APK 检查仪表盘

选中 APK 本身（而非单个类）时，[`ApkTranslator`](/reference/modules/ApkTranslator) 触发 [`ApkDashboard`](/reference/modules/ApkDashboard)，运行一组检查器：

| 检查器 | 检测内容 |
|--------|----------|
| [`JavaDependenciesInspector`](/reference/modules/JavaDependenciesInspector) | 重复的图像/HTTP/JSON 库、已弃用库 |
| [`PrivateNativeLibsInspector`](/reference/modules/PrivateNativeLibsInspector) | 打包了私有 NDK 库（Play Store 违规） |
| [`DynamicSymbolsInspector`](/reference/modules/DynamicSymbolsInspector) | `.so` 缺 SONAME、有 text relocation |
| [`ManifestInspector`](/reference/modules/ManifestInspector) | Android O+ 后台不安全的隐式广播接收器 |
| [`ApkNativeMethodsVisitor`](/reference/modules/ApkNativeMethodsVisitor) | 每个 dex 的原生方法计数与类 |

CLI 下用 `-inspect` 触发：

```bash
java -jar ClassyShark.jar -inspect app.apk
```

详见 [检查 Manifest 教程](/tutorials/inspect-manifest) 与 [检查 native 库教程](/tutorials/inspect-native-libs)。

## 进一步阅读

- 🧩 [DEX 与 Dalvik](./dex)
- 🧩 [二进制 XML](./binary-xml)
- 🧩 [ELF 与 .so](./elf-so)
- 🛠️ [CLI -inspect](/cli/inspect)
