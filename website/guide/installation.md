# 📥 安装

<Badge type="tip" text="指南" />

ClassyShark 是一个独立的 Java 工具，无需复杂安装，下载 JAR 即可运行。

## 前置条件

- ☕ **Java Runtime 8+**（JRE 或 JDK 1.8）。源码 `build.gradle` 中 `sourceCompatibility = 1.8`，见 [构建系统](/reference/architecture/build-system)。

验证 Java 是否可用：

```bash
java -version
```

## 方式一：下载预编译 JAR（推荐）

从 GitHub Releases 获取最新 `ClassyShark.jar`：

👉 [最新 Release](https://github.com/google/android-classyshark/releases)

下载后即可运行：

```bash
java -jar ClassyShark.jar
```

## 方式二：Arch Linux（AUR）

Arch 用户可直接从 AUR 安装预编译 jar：

```bash
yay -S classyshark
```

详见 [AUR 包页面](https://aur.archlinux.org/packages/classyshark/)。

## 方式三：从源码构建

```bash
git clone https://github.com/android-security-engineer/android-classyshark-skills.git
cd android-classyshark-skills/ClassySharkWS
./gradlew fatJar
```

`fatJar` 任务会产出一个包含全部依赖的单个 JAR（`ClassySharkWS-all.jar`），`Main-Class` 为 `com.google.classyshark.Main`。详见 [源码构建教程](/tutorials/build-from-source) 与 [构建系统](/reference/architecture/build-system)。

## 验证安装

```bash
java -jar ClassyShark.jar -inspect path/to/app.apk
```

若输出了 APK 仪表盘（依赖、native 库、方法数表格），则安装成功。

## 下一步

- 🚀 [快速开始](./quick-start)
- 🛠️ [CLI 参考](/cli/index)
