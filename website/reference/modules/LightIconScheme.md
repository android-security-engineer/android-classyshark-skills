# 🧩 LightIconScheme

<div class="module-header">
<Badge type="tip" text="主题子系统" /> <Badge type="info" text="图标路径常量" />
</div>

> 浅色主题的 8 个图标路径常量，与 DarkIconScheme 结构镜像——冗余但对称，为未来浅色图标资源集预留。

<div class="module-source">
📁 源码：<code>ClassySharkWS/src/com/google/classyshark/gui/theme/light/LightIconScheme.java</code> &nbsp; 📦 包：<code>com.google.classyshark.gui.theme.light</code>
</div>

## 职责

`LightIconScheme` 是浅色主题的图标路径常量持有者，定义 8 个 `static final String`，分别指向类路径下 `/resources/` 中的 PNG（菜单/历史/后退/前进/打开/导出/映射/设置）。它把图标资源路径与 `LightTheme` 代码解耦，是 `DarkIconScheme` 的结构镜像——当前两套路径完全相同，共享同一组 PNG。这种冗余是刻意的对称设计：浅色主题未来可携带不同的图标资源集而无需重构 `LightTheme`。

## 关键方法 / 字段

| 名称 | 类型 | 说明 |
|------|------|------|
| `ROOT_PATH` | private static final String | `/resources/` |
| `EXTENSION` | private static final String | `.png` |
| `TOGGLE_ICON_PATH` | static final String | `ic_menu.png` |
| `RECENT_ICON_PATH` | static final String | `ic_history.png` |
| `BACK_ICON_PATH` | static final String | `ic_back.png` |
| `NEXT_ICON_PATH` | static final String | `ic_next.png`（前进图标） |
| `OPEN_ICON_PATH` | static final String | `ic_open.png` |
| `EXPORT_ICON_PATH` | static final String | `ic_export.png` |
| `MAPPING_ICON_PATH` | static final String | `ic_mappings.png` |
| `SETTINGS_ICON_PATH` | static final String | `ic_settings.png` |

## 工作流程

```mermaid
flowchart TD
    A["LightTheme 构造"] --> B["getClass().getResource(TOGGLE_ICON_PATH)"]
    B --> C["new ImageIcon(...)"]
    C --> D["getter 返回图标供工具栏使用"]
```

## 设计要点

- 🪞 **与 DarkIconScheme 结构镜像** — 相同的 8 个常量名与路径拼装方式，对称设计。
- 🔁 **当前路径相同** — 两主题共享同一组 PNG，但替换浅色变体图标无需改主题代码。
- 📦 **包级可见** — 类无 `public`，常量仅 light 包内可见。
- 🧱 **路径拼装** — `ROOT_PATH + "ic_xxx" + EXTENSION`，便于整体迁移。

## 协作关系

- 依赖：无（纯路径常量）
- 被调用：[[LightTheme]]（静态导入路径加载图标）

## 已知问题 / TODO

- 与 [[DarkIconScheme]] 路径完全相同，当前无实际差异（冗余但为未来扩展预留）。

## 相关文档

- [主题子系统架构](/reference/architecture/theme)
