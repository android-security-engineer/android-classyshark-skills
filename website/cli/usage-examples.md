# 🧪 用法示例汇总

<Badge type="tip" text="CLI" /> <Badge type="info" text="实战" /> <Badge type="info" text="CI/CD" />

> 15 个真实场景命令，覆盖 APK 大小分析、方法数、导出、Manifest、依赖、反混淆、native 与批量 CI。命令均以 [`CliMode`](/reference/modules/CliMode) 为入口，详见 [CLI 参考](./index)。

## 📋 命令速查

| # | 场景 | 命令 | 跳转 |
|---|------|------|------|
| 1 | APK 仪表盘 | `-inspect` | [#1](#_1-apk-仪表盘-inspect) |
| 2 | 方法数树形 | `-methodcounts` | [#2](#_2-方法数统计-methodcounts) |
| 3 | 方法数扁平 | `-methodcounts -flat` | [#3](#_3-方法数扁平-methodcounts-flat) |
| 4 | 导出全量 | `-export` | [#4](#_4-导出全量-export) |
| 5 | 导出单类 | `-export <class>` | [#5](#_5-导出单类-export-class) |
| 6 | 查 Manifest | `-export` / API | [#6](#_6-检查-manifest) |
| 7 | 查依赖 | `-inspect` | [#7](#_7-查依赖-inspect) |
| 8 | 反混淆 | GUI 映射 / API | [#8](#_8-反混淆) |
| 9 | 查 native 库 | `-inspect` | [#9](#_9-检查-native-inspect) |
| 10 | 多 DEX 检测 | API `isMultiDex` | [#10](#_10-multidex-检测) |
| 11 | 全字符串表 | API `getAllStrings` | [#11](#_11-全字符串表-getallstrings) |
| 12 | 批量 CI | for 循环 | [#12](#_12-批量-ci-遍历多-apk) |
| 13 | CI 失败门禁 | `-methodcounts` 判定 | [#13](#_13-ci-方法数门禁) |
| 14 | 自更新 | `-update` | [#14](#_14-工具自更新-update) |
| 15 | GUI 打开 | `-open` | [#15](#_15-gui-打开-open) |

---

## 1. APK 仪表盘 `-inspect`

```bash
java -jar ClassyShark.jar -inspect app.apk
```

输出 `~ APK DASHBOARD ~` 表格，含每个 DEX 的方法数、Java 依赖异常、Manifest 系统广播建议、native 私有 API 错误。由 [`ApkTranslator`](/reference/modules/ApkTranslator) → [`ApkDashboard`](/reference/modules/ApkDashboard) 生成。⚠️ 仅 `.apk`，非 APK 会报 `Not an apk file`。

📖 详见 [inspect 命令](./inspect)、[DEX 概念](/guide/concepts/dex)、[方法数 65k 限制](/guide/concepts/method-counts-65k)。

## 2. 方法数统计 `-methodcounts`

```bash
java -jar ClassyShark.jar -methodcounts app.apk
```

按包结构树形展示方法数，定位"方法大户"。`SilverGhostFacade.inspectPackages` → `RootBuilder` → `TreeMethodCountExporter`。

## 3. 方法数扁平 `-methodcounts -flat`

```bash
java -jar ClassyShark.jar -methodcounts app.apk -flat
```

改用 `FlatMethodCountExporter`，输出扁平包名 → 方法数列表，方便 `grep` 与管道处理。第三位及之后的参数中识别到 `-flat` 即切换。

📖 详见 [methodcounts 命令](./methodcounts)、[方法数环形图 GUI](/gui/methods-count)。

## 4. 导出全量 `-export`

```bash
java -jar ClassyShark.jar -export app.apk
```

两参数形式调 `exportArchive`，在**当前工作目录**生成 `all_classes.txt`、`all_methods.txt`、`all_strings.txt`、`method_counts.txt` 与 `AndroidManifest_dump.txt`。由 [`Exporter`](/reference/modules/Exporter) 落盘。

## 5. 导出单类 `-export <class>`

```bash
java -jar ClassyShark.jar -export app.apk com.bumptech.glide.request.target.BaseTarget
```

三参数形式调 `exportClassFromApk`，通过 [`TranslatorFactory`](/reference/modules/TranslatorFactory) 选翻译器，把该类的源码存根写入 `<全限定类名>_dump.txt`。类不存在时打印 `Class doesn't exist in the writeArchive`。

📖 详见 [export 命令](./export)。

## 6. 检查 Manifest

```bash
# 方式一：-export 会顺带导出 AndroidManifest_dump.txt
java -jar ClassyShark.jar -export app.apk

# 方式二：Shark API
java -jar ClassyShark.jar -open app.apk   # GUI 里直接看
```

Manifest 由 [`AndroidXmlTranslator`](/reference/modules/AndroidXmlTranslator) 翻译二进制 XML 为可读文本。API 形式：`Shark.with(apk).getManifest()`。

📖 详见 [二进制 XML 概念](/guide/concepts/binary-xml)、[`AndroidManifestPlainTextReader`](/reference/modules/AndroidManifestPlainTextReader)。

## 7. 查依赖 `-inspect`

```bash
java -jar ClassyShark.jar -inspect app.apk
```

仪表盘的 "Java" 行由 `JavaDependenciesInspector` 输出依赖异常（重复引入、版本冲突等），配合 `-methodcounts` 排查"谁引入了它"。

## 8. 反混淆

```bash
# 方式一：GUI 拖入 mapping.txt
java -jar ClassyShark.jar -open app.apk

# 方式二：API 读取存根
Shark.with(new File("app.apk")).getGeneratedClass("a.b.c")
```

发布包经 ProGuard/R8 混淆后类名变 `a.b.c`，需加载 `mapping.txt`。GUI 通过 [`TokensMapper`](/reference/modules/TokensMapper) SPI 反混淆；API 可生成存根后人工对照 mapping。

📖 详见 [ProGuard 映射与反混淆](/guide/concepts/proguard-mapping)。

## 9. 检查 native `-inspect`

```bash
java -jar ClassyShark.jar -inspect app.apk
```

仪表盘 "Native Error" 行列出引用了私有 native API 的 `.so`（如 `libandroid_runtime.so` 等），由 `PrivateNativeLibsInspector.isPrivate` 判定，标签 ` -- private api!`。`.so` 本体用 [`ElfTranslator`](/reference/modules/ElfTranslator) 查看。

📖 详见 [ELF 与 .so 概念](/guide/concepts/elf-so)、[`ElfReader`](/reference/modules/ElfReader)。

## 10. Multidex 检测

```java
Shark shark = Shark.with(new File("app.apk"));
if (shark.isMultiDex()) {
    System.out.println("⚠️ multidex，custom=" + shark.isCustomMultiDex());
}
```

`isMultiDex()` 统计 `.dex` 条目，≥2 即 multidex；`isCustomMultiDex()` 进一步检测自定义 dex 加载（存在 `classes1.dex` 或非 `classes` 前缀）。

📖 详见 [Multidex 概念](/guide/concepts/multidex)、[`ContentReader`](/reference/modules/ContentReader)。

## 11. 全字符串表 `getAllStrings`

```java
List<String> strings = Shark.with(new File("app.apk")).getAllStrings();
strings.stream().filter(s -> s.contains("http")).forEach(System.out::println);
```

`DexStringsDumper.dumpStrings` 遍历所有 DEX 字符串表，常用于提取 URL、密钥线索、日志。`-export` 也会写到 `all_strings.txt`。

## 12. 批量 CI（遍历多 APK）

```bash
#!/usr/bin/env bash
set -euo pipefail
JAR=ClassyShark.jar
OUTDIR=inspect-out
mkdir -p "$OUTDIR"

for apk in artifacts/*.apk; do
  name=$(basename "$apk" .apk)
  java -jar "$JAR" -inspect "$apk" > "$OUTDIR/$name.txt"
  java -jar "$JAR" -methodcounts "$apk" -flat > "$OUTDIR/$name.methods.txt"
  (cd "$OUTDIR/$name" 2>/dev/null || mkdir -p "$OUTDIR/$name") && \
    (cd "$OUTDIR/$name" && java -jar "../../$JAR" -export "../../$apk" || true)
  echo "✅ $name done"
done
```

⚠️ `-export` 把文件写到**当前工作目录**，故每个 APK 切到独立子目录再跑，避免覆盖。

## 13. CI 方法数门禁

```bash
#!/usr/bin/env bash
set -euo pipefail
THRESHOLD=60000
total=$(java -jar ClassyShark.jar -methodcounts app.apk -flat \
        | awk '{sum+=$NF} END{print sum}')
echo "总方法数: $total / 阈值 $THRESHOLD"
if [ "$total" -gt "$THRESHOLD" ]; then
  echo "❌ 超阈值，应启用 multidex"; exit 1
fi
```

扁平输出每行 `pkg  count`，`awk` 求和后与阈值（如 60000）比较，超限则阻断流水线。详见 [Shark API](/api/index)。

## 14. 工具自更新 `-update`

```bash
java -jar ClassyShark.jar -update dummy.apk
```

`CliMode` 要求 `args.size() >= 2`，第二参数可传任意占位路径。`UpdateManager.checkVersionConsole` 比对版本并提示下载。详见 [update 命令](./update)。

## 15. GUI 打开 `-open`

```bash
java -jar ClassyShark.jar -open app.apk
```

`-open`（或无参数）走 GUI 交互浏览，适合定位问题；CI 用上面 CLI 命令。详见 [GUI 参考](/gui/index)。

---

## 🔗 相关导航

- 📚 [Shark API](/api/index) — 编程式调用 `getAllMethods`/`getAllStrings`/`isMultiDex`
- 🛠️ [CLI 参考](./index) — 命令一览与 [`CliMode`](/reference/modules/CliMode) 入口
- 🏗️ [架构总览](/guide/architecture-overview) — 分层翻译架构
- 📋 [支持的格式](/guide/supported-formats) — APK/DEX/JAR/AAR/SO/CLASS
