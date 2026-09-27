# 📊 Analytics 架构

<Badge type="tip" text="架构" /> <Badge type="info" text="匿名使用统计" />

> 匿名统计子系统复用第三方 `jgoogleanalytics` 库（Siddique Hameed），把用户界面活动上报到 Google Analytics。[`Analytics`](/reference/modules/Analytics) 是枚举单例，`Main` 在分发前调一次 `addActivation()`；底层用 2005 年代的 `__utm.gif` URL 协议，伪造浏览器环境数据。

## 上报链路

```mermaid
flowchart TD
    A["Main.main → Analytics.INSTANCE.addActivation()"] --> B["JGoogleAnalyticsTracker<br/>ClassyShark-Activation / 9.0 / UA-91889970-1"]
    B --> C["FocusPoint("Activation")<br/>树形活动节点"]
    C --> D["trackAsynchronously<br/>新 TrackingThread, MIN_PRIORITY"]
    D --> E["URLBuildingStrategy.buildURL(fp)"]
    E --> F["GoogleAnalytics_v1_URLBuildingStrategy<br/>http://www.google-analytics.com/__utm.gif"]
    F --> G["HTTPGetMethod.request()<br/>HttpURLConnection GET"]
    G --> H["Google Analytics 服务器<br/>（失败仅 logError，不抛出）"]
```

## Analytics：枚举单例

[`Analytics`](/reference/modules/Analytics) 用 `enum Analytics { INSTANCE; }` 保证全 JVM 唯一，`addActivation()` 一次性完成 上报对象 → 焦点点 → 异步追踪 三步：

```java
public void addActivation() {
    new JGoogleAnalyticsTracker("ClassyShark-Activation",
            Version.MAJOR + "." + Version.MINOR, "UA-91889970-1")
            .trackAsynchronously(new FocusPoint("Activation"));
}
```

| 元素 | 值 | 含义 |
|------|-----|------|
| tracker | `JGoogleAnalyticsTracker` | 第三方库的上报门面 |
| 应用名 | `ClassyShark-Activation` | 事件标签 |
| 版本 | `Version.MAJOR.Version.MINOR` | 当前版本，如 `9.0` |
| 账号 | `UA-91889970-1` | Google Analytics 跟踪号（UA 旧格式） |

## FocusPoint：树形活动模型

[`FocusPoint`](/reference/modules/FocusPoint) 是上报的最小单元——一个"焦点点"，可带 `parentFocusPoint` 形成树。URI 与标题用**递归拼接**生成：

| 方法 | 分隔符 | 拼接方向 |
|------|:------:|---------|
| `getContentURI()` | `/` | 父在前，子追加在后 |
| `getContentTitle()` | `-` | 父在前，子追加在后 |

```java
public String getContentURI() {
    if (parentFocusPoint == null) return URLEncoder.encode(name, "UTF-8");
    return parentFocusPoint.getContentURI() + "/" + URLEncoder.encode(name, "UTF-8");
}
```

> 💡 每个焦点段经 `URLEncoder.encode(name, "UTF-8")` 编码，含空格/中文的活动名也能安全进 URL。当前只上报一个 `Activation` 根节点，树形能力为后续界面级埋点预留。

## URLBuildingStrategy：策略接口

[`URLBuildingStrategy`](/reference/modules/URLBuildingStrategy) 把 `FocusPoint` 翻译成可 GET 的完整 URL，是"协议版本"的扩展点：

| 方法 | 签名 | 作用 |
|------|------|------|
| `buildURL` | `String buildURL(FocusPoint)` | 按协议拼出上报 URL |
| `setRefererURL` | `void setRefererURL(String)` | 注入 referer（默认 `http://www.BoxySystems.com`） |

> 🧱 策略模式：若未来切换到 `https://analytics.google.com/g/collect` 之类的新协议，只需新增一个实现并 `setUrlBuildingStrategy` 注入。

## GoogleAnalytics_v1_URLBuildingStrategy：v1 协议

[`GoogleAnalytics_v1_URLBuildingStrategy`](/reference/modules/GoogleAnalytics_v1_URLBuildingStrategy) 复刻 GA **v1 老协议**，`TRACKING_URL_Prefix = "http://www.google-analytics.com/__utm.gif"`（GIF 打点）。参数全部硬编码假浏览器数据：

| 参数 | 值 | 含义 |
|------|-----|------|
| `utmsr` | `1440x900` | 屏幕分辨率（写死） |
| `utmsc` | `32-bit` | 色深 |
| `utmul` | `en-us` | 语言 |
| `utmfl` | `9.0%20%20r28` | Flash 版本 |
| `utmje` | `1` | Java 启用 |
| `utmcc` | 随机 cookie | `__utma=...; __utmz=...` 长串 |
| `utmn` / `utmv` | 随机数 | 防缓存 / 变量 |
| `utmhid` | 随机 | 命中 ID |
| referer | `http://www.BoxySystems.com` 或 setter 覆盖 | 来源页 |

主机名用 `InetAddress.getLocalHost().getHostName()` 兜底，缺省时回落 `localhost`。

> ⚠️ 这套 1440x900 / en-us 的硬编码是"防弹静默设计"：即使拿不到真实环境，参数也永远合法可上报。UA 老协议早已废弃，这里如实保留。

## HTTPGetMethod：最薄请求层

[`HTTPGetMethod`](/reference/modules/HTTPGetMethod) 的 `request()` 是整条链路唯一的网络出口，刻意**不抛异常**：

```java
if (responseCode != HttpURLConnection.HTTP_OK) {
    logError("Error: " + responseCode);   // 仅记日志
}
conn.disconnect();
```

- User-Agent：`Java/<version> (<os.arch; os.name version>)`——如实暴露 JVM，而非浏览器 UA。
- 任何 `IOException` 都被空 `catch` 吞掉，上报失败对主程序零影响。

## JGoogleAnalyticsTracker 与线程

[`JGoogleAnalyticsTracker`](/reference/modules/JGoogleAnalyticsTracker) 提供两条追踪路径：

| 路径 | 行为 | 适用 |
|------|------|------|
| `trackSynchronously` | 当前线程直接 `httpRequest.request()` | 调试 / 需要立即上报 |
| `trackAsynchronously` | `new TrackingThread(fp).start()`，`setPriority(Thread.MIN_PRIORITY)` | 生产路径，不阻塞主线程 |

```java
public void trackAsynchronously(FocusPoint focusPoint) {
    TrackingThread trackingThread = new TrackingThread(focusPoint);
    trackingThread.setPriority(Thread.MIN_PRIORITY);
    trackingThread.start();
}
```

依赖通过 setter 注入可替换：`setUrlBuildingStrategy(...)` / `setLoggingAdapter(...)`。[`LoggingAdapter`](/reference/modules/LoggingAdapter) 是仅有 `logError(String)` / `logMessage(String)` 两方法的窄接口，默认 `DefaultLoggingAdapter` 打印到 stderr。

## 设计要点

- 🥇 **枚举单例** — `INSTANCE` 唯一实例，零同步开销。
- 🧱 **协议可替换** — `URLBuildingStrategy` 接口隔离协议细节，GIF 打点/新版协议可共存。
- 🧵 **最低优先级异步** — `MIN_PRIORITY` 后台线程，抢占资源最少。
- 🤐 **静默失败** — HTTP 非 200 仅 `logError`，异常空吞，埋点永不拖慢主流程。
- 📦 **第三方库内聚** — 全部包装在 `silverghost/analytics` 包内，替换库只需改这一个包。

## 进一步阅读

- 🧩 [Analytics](/reference/modules/Analytics) · [JGoogleAnalyticsTracker](/reference/modules/JGoogleAnalyticsTracker) · [FocusPoint](/reference/modules/FocusPoint) · [URLBuildingStrategy](/reference/modules/URLBuildingStrategy) · [GoogleAnalytics_v1_URLBuildingStrategy](/reference/modules/GoogleAnalytics_v1_URLBuildingStrategy) · [HTTPGetMethod](/reference/modules/HTTPGetMethod) · [LoggingAdapter](/reference/modules/LoggingAdapter)
- 🏗️ [入口层](/reference/architecture/entry-layer) · [架构总览](/guide/architecture-overview)
- 🧩 [Main 模块](/reference/modules/Main)