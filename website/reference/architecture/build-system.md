# 📦 构建系统架构

<Badge type="tip" text="架构" /> <Badge type="info" text="构建系统" />

> ClassySharkWS 是一个非典型的 Gradle Java 项目：`group 'classyshark'`、`version '1.0.0'`，应用 `java` 与 `java-library-distribution` 插件，源码沿用 `src/`（非 `src/main/java`）旧布局，并产出一个内嵌全部依赖的单 JAR `ClassySharkWS-all.jar`。

## 构建坐标与插件

`ClassySharkWS/build.gradle` 的头部直接声明坐标与能力：

| 声明 | 值 | 说明 |
|------|-----|------|
| `group` | `classyshark` | 项目坐标组名 |
| `version` | `1.0.0` | 当前版本 |
| `apply plugin` | `java` | 提供 compile/test/jar 生命周期 |
| `apply plugin` | `java-library-distribution` | 提供 `distZip` / `distTar` 分发任务 |
| `sourceCompatibility` | `1.8` | 字节码目标 Java 8 |

```groovy
group 'classyshark'
version '1.0.0'

apply plugin: 'java'
apply plugin: 'java-library-distribution' // task: gradle distZip

sourceCompatibility = 1.8
```

## 非标准源码布局

ClassyShark 沿用旧式目录——java 与资源都在 `src/` 下，而不是 Gradle 默认的 `src/main/java` 与 `src/main/resources`。构建脚本用 `sourceSets` 显式指回：

```groovy
// ClassyShark doesn't follow the standard src/main/java convention
sourceSets {
    main {
        java {
            srcDirs = ['src/']
        }
        resources {
            srcDirs = ['src/']
        }
    }
}
```

> 💡 这也是配置资源（`*.png` 图标、`classyshark_ui.properties`）能被 `jar` 打包的根源——它们与 `.java` 同目录，被 `resources` 块一并收入。

## 仓库与依赖来源

依赖分两个仓库：`flatDir` 指向仓库根目录的 `../third_party`（相对 `ClassySharkWS/`），`mavenCentral()` 提供其余构件：

```groovy
repositories {
    flatDir {
        dirs '../third_party'
    }
    mavenCentral()
}
```

| 来源 | 构件 | 版本 |
|------|------|------|
| third_party (flatDir) | `asmdex-1.0.jar` | 1.0 |
| third_party (flatDir) | `util-2.0.6.jar` | 2.0.6 |
| third_party (flatDir) | `java-binutils.jar` | — |
| Maven Central | `org.ow2.asm:asm-all` | 5.2 |
| Maven Central | `org.smali:dexlib2` | 2.2.7 |
| Maven Central | `org.apache.bcel:bcel` | 6.5.0 |
| Maven Central | `com.squareup.retrofit2:converter-gson` | 2.9.0 |
| Maven Central | `com.google.code.gson:gson-parent` | 2.9.0 |
| Maven Central | `com.google.guava:guava` | 31.1-jre |
| Maven Central | `com.squareup.okhttp3:okhttp` | 4.10.0 |
| Maven Central | `com.squareup.okio:okio` | 3.2.0 |
| Maven Central | `com.squareup.retrofit2:retrofit` | 2.9.0 |

> 🔍 每个库的用途与使用模块清单见 [依赖架构](/reference/architecture/dependencies)。

## 产物任务

### jar：可执行瘦包

`jar` 任务在 manifest 写入 `Main-Class` 并声明 `Class-Path`，运行 `gradle jar` 后配合 `java -jar` 可直接启动（依赖在旁 `lib/` 目录）：

```groovy
jar {
    manifest {
        attributes(
                'Main-Class': 'com.google.classyshark.Main',
                "Class-Path": configurations.compile.collect { "lib/$it.name" }.join(' ')
        )
    }
}
```

### fatJar：全依赖单 JAR

`fatJar` 把 `configurations.compile` 里的每个 jar 解包后与自身字节码**合并**成一个自包含包——这是发布给用户的 `ClassySharkWS-all.jar`，无需外部依赖即可运行：

```groovy
task fatJar(type: Jar) {
    manifest { attributes('Main-Class': 'com.google.classyshark.Main') }
    baseName = project.name + '-all'
    from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }
    with jar
}
```

### distZip

`java-library-distribution` 插件带来的 `gradle distZip` 会产出标准分发目录（`bin/`、`lib/`、`ClassySharkWS-1.0.0/`），供手工解压部署。

## 构建产物矩阵

| 任务 | 产物 | 依赖 | 适用场景 |
|------|------|------|----------|
| `gradle jar` | `ClassySharkWS.jar` | 外部 `lib/` + `Class-Path` | 开发调试 |
| `gradle fatJar` | `ClassySharkWS-all.jar` | 无（内嵌全部） | 用户发布、CI 用 |
| `gradle distZip` | `ClassySharkWS-1.0.0.zip` | 标准 lib/bin 布局 | 分发安装 |

> ⚠️ `sourceCompatibility = 1.8` 意味着构建产物面向 Java 8+ 运行时；若宿主 JVM 是更高版本请用 `--release` 等价语义的 JDK 构建。

## 设计要点

- 🏛️ **旧布局兼容** — `srcDirs = ['src/']` 保留历史目录，无需迁移文件即构建。
- 🪆 **双产物策略** — 瘦 jar（Class-Path）面向本地开发，fatJar 面向分发，用户零配置运行。
- 📚 **本地 + 远端混合仓库** — 闭源/遗留 jar 走 `third_party`，开源构件走 Maven Central，取舍清晰。
- 🎯 **单一入口** — 两类产物 manifest 都指向 `com.google.classyshark.Main`，与 [入口层架构](/reference/architecture/entry-layer) 呼应。

## 进一步阅读

- 🔗 [依赖架构](/reference/architecture/dependencies) · [从源码构建教程](/tutorials/build-from-source)
- 🏗️ [架构总览](/guide/architecture-overview) · 🚪 [入口层架构](/reference/architecture/entry-layer)