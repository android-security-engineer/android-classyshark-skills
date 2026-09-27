# 发布一个版本（Releasing a version）

本项目依托 **GitHub Release** 机制发布：打一个 `v*` 标签并推送，GitHub Actions
在云端构建可运行的 **fat jar** 并挂到对应 Release 上。本地什么都不用构建。

## 快速操作（两步）

```bash
# 1) 若不成功，先顺手打个补丁提交
git add .github scripts ClassySharkWS/build.gradle
git commit -m "build(release): add tag-driven GitHub Release pipeline"

# 2) 打标签并推送 —— 这会触发 .github/workflows/release.yml
VERSION=v1.0.0
git tag "$VERSION"
git push origin "$VERSION"
```

推送后到仓库的 **Actions** 页盯一次运行；成功结束后到 **Releases** 页就能看到
`$VERSION` 及附件 `ClassySharkWS-all-1.0.0.jar`。

下载后运行：

```bash
java -jar ClassySharkWS-all-1.0.0.jar -agent-stdio               # 无头
java -jar ClassySharkWS-all-1.0.0.jar -agent-gui-stdio [apk]     # GUI 控制
```

## 版本号

`ClassySharkWS/build.gradle` 里 `version 'X.Y.Z'` 是打进 jar 的版本，应与标签
保持一致。

- 新功能/行为变化 → 递进 minor：`1.0.0` → `1.1.0`
- Bug 修复 → 递进 patch：`1.0.0` → `1.0.1`
- 兼容性破坏 → 递进 major，并在 Release body 里写清迁移说明

## 发布管道的机制

`.github/workflows/release.yml`，标签驱动：

1. `on.push.tags: v*` → 触发 `release` job。
2. `setup-java` JDK 8 + 直接下载固定版 Gradle 2.2.1（老 build.gradle 用的是
   `compile`/`flatDir` 这类 Gradle 2.x 的 API，且仓库没带可用的
   `gradle-wrapper.jar`，不能走 `./gradlew`）。
3. `scripts/assemble-third-party.py` 准备三个第三方 jar：
   - `third_party/` 下若已有则直接用（快速路径）；
   - 否则从官方 `google/android-classyshark` Releases 的 fat jar/CDN 拉取并拆出
     `asmdex-1.0` / `util-2.0.6` / `java-binutils`（这三个库 2013 年产物，既不在
     Maven Central、上游也只提交 LICENSE，asmdex 官方 OW2 站点已下线）。
4. `gradle fatJar` → `ClassySharkWS-all-<version>.jar`。
5. `softprops/action-gh-release` 用标签建 Release 并挂 jar。

## 首次运行可能需要修一次

`assemble-third-party.py` 靠 `PACKAGE_ROOTS` 常量把上游 jar 里的类归到三个库。
首次 CI 若报某个 jar 为空，脚本会打印上游 jar 里实际的顶层包名——照着更新
`PACKAGE_ROOTS` 即可。其后稳定。

## 本地先验证脚本逻辑（不联网）

```bash
pip install -q py 2>/dev/null   # 仅需标准库 zipfile/urllib
# 构造一个模拟上游 jar（含 com/google/classyshark + 各第三方包）
mkdir -p /tmp/syn && cd /tmp/syn
for c in com/google/classyshark/Main org/objectweb/asmdex/DexReader \
         com/jawi/Binutils util/Util org/ow2/asm/ASMVisitor com/google/gson/Gson; do
  mkdir -p "$(dirname "$c")"; echo "class $c" > "$c.class"
done
jar cf fake.jar $(find . -name '*.class')
python3 scripts/assemble-third-party.py --keep-upstream /tmp/syn/fake.jar
# → 期望：asmdex-1.0 / util-2.0.6 / java-binutils 三个 jar 各写出，随后删掉测试产物
```