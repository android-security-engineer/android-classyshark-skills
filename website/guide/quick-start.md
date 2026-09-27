# 🚀 快速开始

<Badge type="tip" text="指南" />

> 3 分钟用 ClassyShark 浏览你的第一个 Android 应用。

## 前置条件

- ☕ **Java 8+**（JDK 1.8，与源码 `sourceCompatibility = 1.8` 一致，见 [构建系统](/reference/architecture/build-system)）
- 下载 [最新 ClassyShark.jar](https://github.com/android-classyshark/releases)

## GUI 模式

```bash
java -jar ClassyShark.jar
```

启动后出现窗口，**把一个 APK 拖进窗口**即可。你会看到：

- 左侧 **类树** — 按包/dex 分组导航所有类
- 右侧 **显示区** — 选中类后展示反编译的源码存根（字段、构造器、方法签名）
- 底部 **环形图** — 按包可视化方法数分布

也可以从命令行直接打开指定文件：

```bash
java -jar ClassyShark.jar -open app.apk
```

详见 [GUI 参考](/gui/index)。

## CLI 模式

ClassyShark 提供四个命令行操作，适合脚本与 CI：

```bash
# 1. 检查 APK 仪表盘（依赖、native 库、方法数、Manifest 建议）
java -jar ClassyShark.jar -inspect app.apk

# 2. 统计每个包的方法数（树形）
java -jar ClassyShark.jar -methodcounts app.apk

# 3. 统计方法数（扁平）
java -jar ClassyShark.jar -methodcounts app.apk -flat

# 4. 导出全量数据到文本文件（manifest、类名、方法、字符串、方法计数）
java -jar ClassyShark.jar -export app.apk

# 5. 导出单个类的反编译结果
java -jar ClassyShark.jar -export app.apk com.bumptech.glide.request.target.BaseTarget
```

详见 [CLI 参考](/cli/index)。

## 作为库使用

把 `ClassyShark.jar` 加入 classpath，用 `Shark` facade 编程式访问：

```java
import com.google.classyshark.Shark;
import java.io.File;

Shark shark = Shark.with(new File("app.apk"));

System.out.println(shark.getAllClassNames());   // 所有类名
System.out.println(shark.getManifest());         // AndroidManifest 文本
System.out.println(shark.getAllMethods());       // 所有方法签名
System.out.println(shark.isMultiDex());          // 是否 multidex
```

详见 [Shark API](/api/shark-class) 与 [作为库使用教程](/tutorials/use-as-library)。

## 下一步

- 📖 [什么是 ClassyShark](./what-is-classyshark)
- 🏗️ [架构总览](./architecture-overview)
- 🧩 [模块文档](/reference/modules/Main)
