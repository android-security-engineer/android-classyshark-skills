# 🧩 ClassNode

<div class="module-header">
<Badge type="tip" text="方法计数" /> <Badge type="info" text="组合模式" />
</div>

> 方法计数树的节点，按点分包名递归构建包层级，并把方法数累加到自身及各级子节点。

<div class="module-source">
📁 源码：<code>ClassySharkWS/src/com/google/classyshark/silverghost/methodscounter/ClassNode.java</code> &nbsp; 📦 包：<code>com.google.classyshark.silverghost.methodscounter</code>
</div>

## 职责

`ClassNode` 用组合模式构建一棵"按包聚合的方法计数树"。每个节点持有一个 `key`（包名段，如 `com`）、一个方法计数、以及一个共享的 `HashMap` 子节点表。当 `add(ClassInfo)` 注入一个类时，节点会按 `.` 拆分包名，递归地把方法数累加到自身以及沿途各级子节点。由于父节点的 `methodCount` 是所有后代之和，这棵树天然形成"按包聚合的方法计数"视图，供导出器渲染。

## 关键方法 / 字段

| 名称 | 类型 | 说明 |
|------|------|------|
| `childNodes` | private Map&lt;String, ClassNode&gt; | 子节点表（按包名段索引） |
| `key` | private String | 本节点对应的包名段 |
| `methodCount` | private int | 本节点（含所有后代）累计方法数 |
| `ClassNode(String key)` | 构造器 | 带名构造，用于命名根 |
| `ClassNode()` | 构造器 | 无参构造，用于子节点（key 后赋值） |
| `add(ClassInfo)` | void | 入口：拆分点分名后委托递归 `add` |
| `add(int, String[], ClassInfo)` | private void | 递归核心：累加计数 + 创建/下钻子节点 |
| `getChildNodes()` | Map | 暴露子节点表，供导出器遍历 |

## 工作流程

```mermaid
flowchart TD
    A["add(ClassInfo)"] --> B["split(\".\") 得到包名段数组"]
    B --> C["add(0, packages, classInfo)"]
    C --> D["methodCount += classInfo.methodCount"]
    D --> E{"pos >= length?"}
    E -- 是 --> F["return（叶子已累加）"]
    E -- 否 --> G{"子节点存在?"}
    G -- 否 --> H["new ClassNode() + put 到 childNodes"]
    G -- 是 --> I["取出已有子节点"]
    H --> J["child.add(pos+1, ...)"]
    I --> J
    J --> C
```

## 设计要点

- 🌳 **组合模式** — 节点既是数据载体也是容器，父子同构，递归处理统一。
- ➕ **累加即聚合** — `methodCount` 在每层 `add` 都加上当前类的方法数，因此父节点值 = 所有后代之和，无需单独的聚合 pass。
- 🗺️ **共享 HashMap 子节点** — 子节点查找/插入用 `childNodes.get/put`，O(1) 定位，避免线性扫描。
- 🔑 **key 延迟赋值** — 无参构造 + `child.key = packages[...]` 的写法，让"创建"与"命名"分离，便于在 `put` 前先判断是否存在。
- 🧩 **拆分点约定** — 依赖 `ClassInfo.packageName` 是点分全限定名；包名层级深度由 `.` 数量决定。

## 协作关系

- 消费 → [[ClassInfo]]（`add` 读取其包名与方法数）
- 构造方 → [[RootBuilder]]（`fillClassesWithMethods` 创建根节点并逐个 `add`）
- 被遍历 → [[FlatMethodCountExporter]] / [[TreeMethodCountExporter]]（通过 `getChildNodes` 递归渲染）

## 已知问题 / TODO

- 无参构造器把 `key` 留空再在外部赋值，封装性略弱；若并发 `add` 同一包名段存在重复创建风险（但当前为单线程使用，实际无碍）。
- `toString()` 输出 `key + ": " + methodCount`，与导出器格式不一致，仅调试用。

## 相关文档

- [方法计数子系统](/reference/architecture/methodscounter)
- [导出器](/reference/architecture/exporter)
