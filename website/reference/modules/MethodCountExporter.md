# 🧩 MethodCountExporter

<div class="module-header">
<Badge type="tip" text="导出器" /> <Badge type="info" text="策略接口" />
</div>

> 方法计数树渲染的策略接口，用单方法 `exportMethodCounts` 解耦树的表示与输出格式。

<div class="module-source">
📁 源码：<code>ClassySharkWS/src/com/google/classyshark/silverghost/exporter/MethodCountExporter.java</code> &nbsp; 📦 包：<code>com.google.classyshark.silverghost.exporter</code>
</div>

## 职责

`MethodCountExporter` 是一个仅含单方法的策略接口。它定义了"如何把一棵 `ClassNode` 方法计数树渲染成文本"的契约，把树的内部表示（`ClassNode` 组合结构）与具体输出格式（扁平列表 vs 树形缩进）解耦。`Exporter` 面向接口编程，可在不同渲染器间自由切换。

## 关键方法 / 字段

| 名称 | 类型 | 说明 |
|------|------|------|
| `exportMethodCounts(ClassNode rootNode)` | void | 唯一策略方法：接收根节点并输出计数 |

## 工作流程

```mermaid
flowchart LR
    A["Exporter.writeMethodCounts"] --> B["new TreeMethodCountExporter(pw)"]
    B --> C["exportMethodCounts(rootNode)"]
    C --> D["具体实现递归渲染 ClassNode"]
```

## 设计要点

- 🎯 **单一方法接口** — 仅 `exportMethodCounts`，符合最小接口原则，实现成本极低。
- 🧩 **策略模式解耦** — `ClassNode` 树结构不关心如何渲染，渲染器不关心树如何构建，二者通过此接口对接。
- 🔌 **可插拔渲染器** — 已有 [[FlatMethodCountExporter]]（扁平）与 [[TreeMethodCountExporter]]（树形）两种实现，未来可扩展 CSV/JSON 等格式而不改调用方。
- 📦 **同包内聚** — 接口与所有实现同处 `exporter` 包，形成完整的导出器族。

## 协作关系

- 实现 ← [[FlatMethodCountExporter]]（扁平列表渲染）
- 实现 ← [[TreeMethodCountExporter]]（Unicode 树形渲染）
- 被调用 ← [[Exporter]]（`writeMethodCounts` 持有并调用）
- 输入 ← [[ClassNode]]（策略方法的参数类型）

## 已知问题 / TODO

- 无明显已知问题。接口职责清晰，扩展点明确。

## 相关文档

- [导出器子系统](/reference/architecture/exporter)
- [方法计数子系统](/reference/architecture/methodscounter)
