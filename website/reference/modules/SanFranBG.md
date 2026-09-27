# 🧩 SanFranBG

<div class="module-header">
<Badge type="tip" text="GUI 涂鸦层" /> <Badge type="info" text="常量持有" />
</div>

> 金门大桥 ASCII 艺术常量，归因 ascii-code.com。

<div class="module-source">
📁 源码：<code>ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/doodles/SanFranBG.java</code> &nbsp; 📦 包：<code>com.google.classyshark.gui.panel.displayarea.doodles</code>
</div>

## 职责

`SanFranBG` 是公共类，持有一个公共静态常量 `SHARKEY`，内容为金门大桥 ASCII 艺术。它归属 `ascii-code.com`，并标注 `ClassyShark ver. 6.0 powered by SilverGhost`。作为可插拔涂鸦集的一员，可被 [[Doodle]] 门面选中以呈现金门大桥欢迎屏。

## 关键方法 / 字段

| 名称 | 类型 | 说明 |
|------|------|------|
| `SHARKEY` | public static final String | 金门大桥 ASCII 艺术 + 归因 + 版本串 |

## 工作流程

```mermaid
flowchart LR
    A["Doodle.get 切换为 SanFranBG.SHARKEY"] --> B["DisplayArea 插入金门大桥"]
    B --> C["欢迎屏显示地标艺术"]
```

## 设计要点

- 🌉 **常量持有者** — 类本身只承载一段静态 ASCII 艺术常量。
- 📝 **归属标注** — 串尾附 `ascii-code.com` 来源与 6.0/SilverGhost 版本标记。
- 🌐 **公共类** — 可见性为 public，便于外部引用。

## 协作关系

- 被引用 ← [[Doodle]]（可选涂鸦）

## 已知问题 / TODO

- 无明显已知问题；版本号硬编码 `6.0` 不随 `Version` 派生。

## 相关文档

- [GUI 架构](/reference/architecture/gui-layer)
- [[Doodle]]
- [[SharkBG]]
