# ☕ JavaTranslator 子系统

<Badge type="tip" text="架构" /> <Badge type="info" text="Java 源码 stub 渲染" />

> [JavaTranslator](/reference/modules/JavaTranslator) 把**任意类**（.class / .jar / .dex / .apk 内）渲染成可读的类 Java 源码 stub——字段、构造器、方法、泛型、注解一应俱全。它的秘密在于 [MetaObject](/reference/modules/MetaObject) 抽象：由 [MetaObjectFactory](/reference/modules/MetaObjectFactory) 按来源选择**反射 / ASM / dexlib2** 三条实现路径，并以 `MetaObjectWithMapper` 装饰器接入 ProGuard 反混淆。

## MetaObject：统一的类元模型

`MetaObject` 是抽象类，定义了一份「类应该有什么」的清单，三条实现各自用不同技术去填充同一份清单：

| 抽象方法 | 语义 |
|----------|------|
| `getClassGenerics()` / `getSuperclassGenerics()` | 类/父类泛型 |
| `getName()` | 类名（含 `$Inner` 层级） |
| `getAnnotations()` / `getModifiers()` | 注解与修饰符 |
| `getSuperclass()` / `getInterfaces()` | 继承与实现 |
| `getDeclaredFields()` / `getDeclaredConstructors()` / `getDeclaredMethods()` | 三桶声明 |

数据类随附在 MetaObject 内：`InterfaceInfo` / `FieldInfo` / `ConstructorInfo` / `MethodInfo` / `AnnotationInfo` / `ParameterInfo` / `ExceptionInfo`。

## 三路策略选择

`MetaObjectFactory.buildMetaObject(className, archiveFile)` 按**来源扩展名**分派，异常时逐级回退：

```mermaid
flowchart TD
    B["buildMetaObject(className, archiveFile)"] --> E{"归档后缀?"}
    E -- ".jar" --> J["反射：ClassUtils.loadClassFromJar"]
    J --> JOK{"NoClassDefFoundError?"}
    JOK -- 否 --> J1["MetaObjectClass（反射）"]
    JOK -- 是 --> A["ASM 回退 → MetaObjectAsmClass"]
    E -- ".class" --> A
    A --> A1["ClassDetailsFiller + ClassReader"]
    E -- ".dex" --> D["DexlibLoader.loadDexFile<br/>+ DexlibAdapter 找 ClassDef"]
    D --> D1["MetaObjectDex"]
    E -- ".apk" --> AP["MultidexReader.extractClassesDexWithClass<br/>定位含该类的 dex → dex 路径"]
    AP --> D1
    E -- ".aar" --> AR["提取内嵌 jar 到临时文件 → 走 jar 路径"]
    AR --> J
    E -- 其它/全失败" --> F["new MetaObjectClass(Exception.class)<br/>最坏兜底"]
```

| 路径 | 触发来源 | 底层技术 | 实现类 |
|------|----------|----------|--------|
| **反射** | `.jar`（class 可加载时） | `ClassUtils.loadClassFromJar` + Java 反射 | [MetaObjectClass](/reference/modules/MetaObjectClass) |
| **ASM** | `.class`、`.jar` 加载失败回退 | [ClassDetailsFiller](/reference/modules/ClassDetailsFiller) + `ClassReader.accept` 字节码解析 | [MetaObjectAsmClass](/reference/modules/MetaObjectAsmClass) |
| **dexlib2** | `.dex`、`.apk` 内类 | `DexlibLoader.loadDexFile` + [DexlibAdapter](/reference/modules/DexlibAdapter) | [MetaObjectDex](/reference/modules/MetaObjectDex) |
| **兜底** | 任意失败 | `new MetaObjectClass(Exception.class)` | [MetaObjectClass](/reference/modules/MetaObjectClass) |

> 💡 **为什么优先反射？** 反射拿到的 `Class` 是运行时元数据，泛型（`getGenericType`）最完整；ASM 是字节码视角、也能取泛型但更绕；dexlib2 是纯静态解析。三路覆盖「JVM 外循环 / 不可加载 / 无 JVM」三类场景。

## JavaTranslator 的渲染管线

`apply()` 按固定顺序把 MetaObject 的元数据拼成源码 stub：

```java
public void apply() {
    emitPackage();                       // package + import（QualifiedTypesMap 收全名）
    emitClassHeader(getName(), modifiers, superclass, interfaces, annotations);
    emitFields(...);                     // 字段声明
    emitConstructors(...);               // 构造器
    emitMethods(...);                    // 方法签名（含参数泛型）
    fillImports(); fillClassDecl(); fillFields(); fillCtors(); fillMethods();
}
```

依赖收集在翻译中同步进行：`QualifiedTypesMap.namesMapper` 记录每个用到的全限定类型，`getDependencies()` 返回 `namesMapper.getFullTypes()`——这就是「当前类依赖谁」的来源。

## 反混淆：MetaObjectWithMapper 装饰器

[JavaTranslator.addMapper](/reference/modules/JavaTranslator) 用**装饰器**而不是继承来挂反混淆，保持 MetaObject 族不动：

```java
public void addMapper(TokensMapper reverseMappings) {
    this.metaObject = new MetaObjectWithMapper(this.metaObject, reverseMappings);
}
```

[MetaObjectWithMapper](/reference/modules/MetaObjectWithMapper) 包装原 metaObject + 反向映射表：`getName()` 查表命中即返回原始名，其余委托原对象。于是反混淆是**逐名重写**，类引用、继承链、方法声明处全部还原（详见 [概念：proguard-mapping](/guide/concepts/proguard-mapping)）。

## 与 ContentReader / TranslatorFactory 的衔接

- **来源** — `.class`/`.jar`/`.dex`/`.apk` 内任意类名由 ContentReader 列表提供，GUI 点中即 `createTranslator` → JavaTranslator。
- **回退** — TranslatorFactory 对一切未命中内置扩展名的元素落 `new JavaTranslator(className, archiveFile)`，是全包默认翻译器。
- **产物** — 仍以 `List<ELEMENT>` 输出，`MODIFIER`/`IDENTIFIER`/`ANNOTATION` 等 TAG 让 DisplayArea 着色（见 [Translator 核心](/reference/architecture/translator-core)）。

## 设计要点

- 🪞 **一抽象三实现** — MetaObject 定义「长什么样」，反射/ASM/dexlib 各自回答「怎么拿到」，新增字节码后端零改动渲染层。
- 🛡️ **级联回退** — jar 加载失败降 ASM、全失败落 Exception 兜底，任何输入都能渲染出一个 stub。
- 🧈 **装饰器反混淆** — `MetaObjectWithMapper` 透明包裹，原 MetaObject 族零污染。
- 🎯 **默认翻译器** — JavaTranslator 既是分支之一，又是全包回退，实际覆盖绝大多数点击场景。

## 进一步阅读

- 🧩 [JavaTranslator](/reference/modules/JavaTranslator) · [MetaObjectFactory](/reference/modules/MetaObjectFactory) · [MetaObject](/reference/modules/MetaObject) · [MetaObjectClass](/reference/modules/MetaObjectClass) · [MetaObjectAsmClass](/reference/modules/MetaObjectAsmClass) · [MetaObjectDex](/reference/modules/MetaObjectDex) · [MetaObjectWithMapper](/reference/modules/MetaObjectWithMapper) · [ClassDetailsFiller](/reference/modules/ClassDetailsFiller)
- 🏗️ [Translator 分发架构](/reference/architecture/translator) · [Translator 核心契约](/reference/architecture/translator-core) · [ContentReader 解析引擎](/reference/architecture/contentreader)
- 📚 [概念：reflect-vs-asm-vs-dexlib](/guide/concepts/reflect-vs-asm-vs-dexlib) · [概念：proguard-mapping](/guide/concepts/proguard-mapping) · [GUI 显示层](/gui/display-area)
