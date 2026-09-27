export const meta = {
  name: 'produce-module-docs-2',
  description: '为 ClassyShark 另一半子系统生成逐模块 Markdown 文档',
  phases: [{ title: '生成模块文档批次2', detail: 'java translator / methodscounter+exporter+plugins / GUI / theme+analytics+updater+android' }],
}

const TPL = `你正在为 android-classyshark 项目的 VitePress 文档站写「模块文档」。

【写作要求】
1. 用简体中文。
2. 每个类写一个 Markdown 文件，路径为 /home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/reference/modules/<类名>.md
3. 必须先用 Read 工具读取该类的实际源码文件（路径在下方给出），基于真实代码写，不得虚构方法/字段。
4. 严格遵循模板（参考已存在的标杆 website/reference/modules/Main.md）：

# 🧩 {类名}

<div class="module-header">
<Badge type="tip" text="{子系统}" /> <Badge type="info" text="{设计模式}" />
</div>

> {一句话职责}

<div class="module-source">
📁 源码：<code>{相对仓库根的路径}</code> &nbsp; 📦 包：<code>{java package}</code>
</div>

## 职责
{2-4 句}

## 关键方法 / 字段
| 名称 | 类型 | 说明 |
|------|------|------|
{从源码提取真实方法/字段 5-12 行}

## 工作流程
\`\`\`mermaid
{能画流程图就画，否则有序步骤}
\`\`\`

## 设计要点
- {3-5 个真实设计要点}

## 协作关系
- 依赖：[[{类名}]]
- 被调用：[[{类名}]]

## 已知问题 / TODO
- {真实问题；无则写"无明显已知问题"}

## 相关文档
- [{文本}](/guide/...) 或 (/cli/...) 或 (/reference/architecture/...)

5. 多用 emoji 图标。源码路径相对仓库根。[[类名]] 只链接项目真实存在的类。

`

const batches = [
  {
    subsystem: 'Java Translator',
    classes: [
      { name: 'JavaTranslator', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/JavaTranslator.java', summary: '主 Translator 实现，把单个类(jar/class/dex/apk/aar)渲染成类 Java 源码存根。apply 两阶段：fillTypes 收集所有引用类型到 QualifiedTypesMap，fillSource 发出 import+类声明+字段+构造器+方法。addMapper 在 MetaObjectWithMapper 包装元对象做 ProGuard 反混淆。getDependencies=映射器的完整类型集=导入列表。方法/字段按名字字母序。发出带 { } 空体的存根。有4个 testXxx main。' },
      { name: 'MetaObject', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/MetaObject.java', summary: '类元数据抽象基类。声明内部数据类 InterfaceInfo/FieldInfo(Comparable)/ConstructorInfo/MethodInfo(Comparable)/AnnotationInfo/ParameterInfo/ExceptionInfo 及抽象 getter(name/修饰符/超类/泛型/接口/字段/构造器/方法/注解)。JavaTranslator 统一类型系统，三个子类适配三源(反射/ASM/dexlib)。FieldInfo/MethodInfo Comparable 启用字母排序。纯数据持有者。' },
      { name: 'MetaObjectFactory', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/MetaObjectFactory.java', summary: '按存档扩展名选 MetaObject 子类的静态工厂。buildMetaObject 入口。.jar→getMetaObjectFromJar(反射 MetaObjectClass，NoClassDefFoundError 回退 MetaObjectAsmClass)、.class→MetaObjectAsmClass、.dex→MetaObjectDex、.apk→多 dex 提取再 MetaObjectDex、.aar→提取内嵌 jar 递归。反射和 ASM 间回退策略——反射泛型更全但需 classpath 可加载，ASM 始终可用。失败回退 new MetaObjectClass(Exception.class)。' },
      { name: 'MetaObjectWithMapper', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/MetaObjectWithMapper.java', summary: '装饰器 MetaObject，用 TokensMapper.getReverseClasses() 反向映射名替换 getName() 结果，其余 getter 直传包装元对象。仅覆盖 getName——JavaTranslator 用它作类声明和 import 的键。reverseMappingClasses 可空(防御设)。// TODO not clear why is it null 注释承认潜在 bug。ProGuard 反混淆进入呈现管道处。' },
      { name: 'QualifiedTypesMap', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/QualifiedTypesMap.java', summary: 'HashMap<String,String> 全限定名(java.util.Map)→短名(Map)，跟踪遇到类型。decodeAndStore 静态递归解码器处理数组([Ljava.util.Map;→Map[]、[I→int[])，原语经 DexlibAdapter.primitiveTypes。addType/getType(存并返回短名)、getTypeNull(返回但不存——用于自身类名不出现在 import)、removeType、getFullTypes(导入列表排序键集)。自身类名经 getTypeNull 查找避免进 import。' },
      { name: 'ClassBytesFromJarExtractor', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/asm/ClassBytesFromJarExtractor.java', summary: '从 jar 提取 .class 条目原始字节到 byte[]。getBytes(fullClassName, jarPath)按类名找条目读流到数组。/转. 匹配。未找到抛 IOException("File not found")。0xFFFF 缓冲。getBytes(InputStream)通用、bytesToHex 调试辅助。由 MetaObjectAsmClass(jar 情况)用。main 打印十六进制。' },
      { name: 'ClassDetailsFiller', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/asm/ClassDetailsFiller.java', summary: 'ASM ClassVisitor 扫描类字节(ClassReader)，填反射 MetaObject API 期望的字段/方法/构造器/接口列表。visit(name/超类/修饰符/接口)、visitField(FieldInfo)、visitMethod(方法vs构造函数拆分，Type.getArgumentTypes/getReturnType 参数返回类型)。目标 ASM5。类型描述符解码委派 DexlibAdapter.getTypeName/getClassStringFromDex(复用 dex 适配器)。不发出注解/异常(fillConstructor 有 TODO)。visitAttribute/visitInnerClass/visitSource/visitOuterClass 空操作。main 在独立 .class 跑。' },
      { name: 'MetaObjectAsmClass', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/asm/MetaObjectAsmClass.java', summary: '基于 ASM 的 MetaObject 实现，反射失败时用(依赖不在 classpath)。三构造重载:(className,jarFile)/(classFile)/(Class clazz)，均读字节经 ClassDetailsFiller。纯适配器，所有 getter 委派 ClassDetailsFiller。(className,jarFile)用 ClassBytesFromJarExtractor，(File)用 Files.readAllBytes，(Class)从类加载器资源流。MetaObjectFactory 中 ASM 回退由 NoClassDefFoundError 触发。' },
      { name: 'ClassUtils', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/reflect/ClassUtils.java', summary: '静态工具，用指向 jar 的 URLClassLoader 反射加载类。loadClassFromJar(jarPath, className)返回 Class。创建新 URLClassLoader 子实例唯一 URL 为 jar——加载的类只见该 jar。抛 MalformedURLException/ClassNotFoundException，MetaObjectFactory.getMetaObjectFromJar 捕获触发 ASM 回退。SPI 边界标记。单方法类。' },
      { name: 'MetaObjectClass', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/clazz/reflect/MetaObjectClass.java', summary: '基于反射的 MetaObject，运行时可加载时优先用。包装 Class<?>，经 java.lang.reflect(getDeclaredFields/Constructors/Methods/Annotations/getTypeParameters/getGenericParameterTypes/getGenericReturnType)提取。支持泛型：getClassGenericsString 发 <T,U>、getFieldGenericsString 发 <String,Integer>。三个 MetaObject 实现中唯一发泛型信息——ASM/dex 变体返回空泛型。convertParameters 采用原始 Class[] 和泛型 Type[] 分别发。MetaObjectFactory jar 加载成功时默认选。' },
      { name: 'DexlibAdapter', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/dex/DexlibAdapter.java', summary: '桥接 dexlib2 类型表示到 Java 样式名。静态 primitiveTypes 映射(I→int/V→void 等9个)。getTypeName(dexlibType)、getClassStringFromDex(剥 L...; 包装、/转.)、getClassDefByName(线性扫 dex)、isMatchFromDex。多处复用——ClassDetailsFiller(ASM 侧)/MetaObjectDex/DexMethodsDumper/SyntheticAccessorsInspector/StressTest。数组检测保留前导[ 延迟到 QualifiedTypesMap.decodeAndStore。9 原语单事实源。' },
      { name: 'MetaObjectDex', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/dex/MetaObjectDex.java', summary: '由 dexlib2 ClassDef 支撑的 MetaObject 实现，类从 APK/DEX 加载时用。适配 ClassDef 的字段/方法/接口/注解到 MetaObject 数据类。方法名 <init> 检测构造函数。ClassDef 空则回退私有 EmptyClassDef 空对象(~200行实现 ClassDef 所有方法返回空，避免下游 NPE)。无泛型支持(全返回"")。方法无异常(硬编码空)。构造函数检测纯基于名 "<init"。main 对 classes.dex。' },
      { name: 'MultidexReader', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/dex/MultidexReader.java', summary: '扫描 APK zip 按需提取 classes*.dex(及动态加载嵌入 jar/zip 内的 dex)。fillApkDashboard(File,ApkDashboard)主扫描——每 dex 经 fillAnalysisPerClassesDexIndex 提取检查、扫 lib/ 原生条目(Elf+DynamicSymbolsInspector)、readClassNamesFromMultidex 填 allClasses。extractClassesDexWithClass(className,apk)线性搜含类的 dex(含内部 zip dex)。提取经 SherlockHash 缓存。嵌入 jar/zip 内 dex 用 ### 连接内外条目名。哨兵索引99/999。APK 扫描中心枢纽。' },
      { name: 'StressTest', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/translator/java/StressTest.java', summary: '测试工具，遍历 jar/dex 所有类经 TranslatorFactory 翻译每个并打印 stdout，健全性测试管道。runAllClassesInJar(JarReader.readClassNamesFromJar 读名)、runAllClassesInDex(DexlibLoader+getClasses 读)。证明管道扩展到 ~50000 类(android.jar)。经 DexlibAdapter.getClassStringFromDex 规范化 dex 类型串再交工厂。非 Translator。main 在 android.jar 跑。' },
    ]
  },
  {
    subsystem: 'MethodsCounter + Exporter + Plugins',
    classes: [
      { name: 'ClassInfo', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/methodscounter/ClassInfo.java', summary: '值对象，持 packageName 和 methodCount。简单数据载体。' },
      { name: 'ClassNode', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/methodscounter/ClassNode.java', summary: '树节点，按包名(点分)拆分建包层级树。add(ClassInfo) 递归把类方法数累加到自身及各级子节点。共享 HashMap 子节点，父节点 methodCount=所有后代之和，自然形成"按包聚合的方法计数"。' },
      { name: 'RootBuilder', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/methodscounter/RootBuilder.java', summary: '按文件类型分发到 aar/jar/dex/apk 解析路径。fillClassesWithMethods(fileName)。JAR 用 Apache BCEL ClassParser 提取方法数；DEX/APK 用 dexlib2 遍历 ClassDef.getMethods()；APK 解压所有 .dex 临时文件逐一处理；AAR 解压内嵌 jar 再委托。模板方法式分发。含未完成 fillFromJayce TODO。' },
      { name: 'Exporter', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/exporter/Exporter.java', summary: '静态工具类(私有构造)，把归档数据导出多文本文件：manifest、all_classes.txt、all_methods.txt、all_strings.txt、method_counts.txt。writeArchive 串联全流程，调 RootBuilder 建方法计数树用 TreeMethodCountExporter 输出。writeStringTables 用 FileChannel.map(MMAP)写大字符串表。writeMethods/writeStringTables 仅对 APK(依赖 DexMethodsDumper/DexStringsDumper)。' },
      { name: 'MethodCountExporter', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/exporter/MethodCountExporter.java', summary: '策略接口，单方法 exportMethodCounts(ClassNode rootNode)。解耦方法计数树表示与渲染。' },
      { name: 'FlatMethodCountExporter', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/exporter/FlatMethodCountExporter.java', summary: '扁平化导出器，递归打印每节点为"全限定路径 - 计数"行。用 String[] 累积路径前缀，System.arraycopy 扩展，实现 fully-qualified name 输出。' },
      { name: 'TreeMethodCountExporter', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/exporter/TreeMethodCountExporter.java', summary: '树形导出器，用 Unicode box-drawing(╠ ╚ ║ ═)渲染缩进树。boolean[] isFinalLevel 跟踪每层是否最后兄弟节点，据此选拐角字符。纯文本树形渲染技巧。' },
      { name: 'EmptyFullArchiveReader', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/plugins/EmptyFullArchiveReader.java', summary: 'FullArchiveReader 接口空实现(Null Object)，readAsyncArchive 空操作，buildTranslator 返回返回空行为的匿名 Translator。安全默认实现避免 NPE，适合占位或测试桩。' },
      { name: 'IdentityMapper', path: 'ClassySharkWS/src/com/google/classyshark/silverghost/plugins/IdentityMapper.java', summary: 'TokensMapper 恒等映射实现，readMappings 返回 self，getReverseClasses 返回空 TreeMap。混淆/反混淆映射链中"无操作"节点，与有真实映射 Mapper 互换。SilverGhost 默认 TokensMapper。' },
    ]
  },
  {
    subsystem: 'GUI 顶层 + Panel',
    classes: [
      { name: 'GuiMode', path: 'ClassySharkWS/src/com/google/classyshark/gui/GuiMode.java', summary: 'GUI 模式入口(相对 CLI)。with(argsAsArray)从 main 调：查更新，EDT 上 SwingUtilities.invokeLater 构建 JFrame。getTheme 返回缓存 ThemeManager.getCurrentTheme 供面板。buildAndShowClassyShark/buildClassySharkFrame。按参数数量分发 ClassySharkPanel 构造重载(0=空,2=存档,3=存档+类名)。设系统原生 LAF 后 theme.applyTo(frame)覆盖。ClassySharkPanel 生产者。' },
      { name: 'ClassySharkPanel', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/ClassySharkPanel.java', summary: '中央中介者，类头注释"MVM==>模型-视图-中介者(此类)"。同时实现 ToolbarController/ViewerController/KeyListener，绑工具栏+树+显示区+方法计数+环形图，委派 SilverGhost 模型。buildUI 组装 JSplitPane+JTabbedPane(Classes树/方法计数+右侧显示区+环形图)。fillDisplayArea 核心分发(类/搜索结果/manifest)。重活全包 SwingWorker 避免阻塞 EDT。Reducer 自动补全驱动查看顶级类。AndroidManifest.xml - 搜索前缀路由到清单。' },
      { name: 'ViewerController', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/ViewerController.java', summary: '接口，中介者向树/显示区/图表子视图公开回调：类选择、import 点击、类型词点击、方法计数节点选。extends ArchiveDisplayer 强制 displayArchive(File)。FilesTree/DisplayArea/RingChartPanel/MethodsCountPanel 从 UI 事件回调到面板的窄接口——不直接依赖 ClassySharkPanel。' },
      { name: 'ArchiveDisplayer', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/ArchiveDisplayer.java', summary: '单方法接口 displayArchive(File file)。ToolbarController 和 ViewerController 都扩展的最低公约数，文件打开/拖放处理程序可把目标当"能显示存档的东西"。FileTransferHandler 和 RecentArchivesButton 针对最小接口编程而非整个面板——拖放能在三个放置区生效的原因。' },
      { name: 'FileTransferHandler', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/FileTransferHandler.java', summary: '拖放 Swing TransferHandler 子类，注册在树/显示区/环形图。importData 遍历拖放文件经 FileChooserUtils.isSupportedArchiveFile 过滤，更新 CurrentFolderConfig/RecentArchivesConfig，调 archiveDisplayer.displayArchive。接收 ArchiveDisplayer(最小接口)而非 ClassySharkPanel。忽略不支持文件(静默)不中止整个传输。' },
      { name: 'FilesTree', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/tree/FilesTree.java', summary: '左侧 JTree 导航，据类名和组件列表建树。fillArchive(File,List,List)。选择监听按扩展名(.dex/.jar/.apk/.so)和是否带 NodeInfo 叶子路由点击。createJTreeModelAndroid(多 dex：拆 classes/res/libs 子树按包按 dex 分组)、createJTreeModelClass(jar/class：仅按包分组)、fillComponents(原生库节点)。两种树布局按扩展名选。自带 FileTransferHandler。main 独立可视化测试。' },
      { name: 'NodeInfo', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/tree/NodeInfo.java', summary: '显示短名但持全限定名的树节点用户对象。toString() 用正则 .*?([^.]+)$ 提取最后.后段为简单类名。保持树 UI 整洁(无包路径杂乱)，选择监听读回 fullname 馈 SilverGhost 翻译。小专用值对象。' },
      { name: 'CellRenderer', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/tree/CellRenderer.java', summary: 'DefaultTreeCellRenderer 子类，树颜色委派活动 Theme(getBackgroundSelectionColor/getTextNonSelectionColor)。显式返回 null 背景禁用默认非选背景让主题背景透出。FilesTree 和 MethodsCountPanel 共享。按主题切换重绘——支持深/浅重绘的唯一渲染器。' },
      { name: 'DisplayArea', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/DisplayArea.java', summary: '右侧 JTextPane 包装，渲染所有内容：类源、类名列表、搜索结果、鲨鱼涂鸦、错误。经 Translator.ELEMENT 标记→主题颜色映射应用语法高亮。displayClass(主类视图，遍历标记按 TAG 设前景色后滚动到搜索键)、displayClassNames(子串高亮限50)、displayAllClassesNames(BatchDocument 快速路径)、displaySearchResults、displaySharkey、displayError、fillTokensToDoc(标记→颜色核心)、calcScrollingPosition。DisplayDataState 驱动双击行为。Ctrl-C 无选择时复制全文。' },
      { name: 'IDisplayArea', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/IDisplayArea.java', summary: 'DisplayArea 实现的接口。声明组件访问器+6种显示方法(displayClassNames、displayClass 两重载、displaySharkey、displayError、displaySearchResults)。让 ClassySharkPanel 针对接口编程简化成员声明(IDisplayArea displayArea)。' },
      { name: 'BatchDocument', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/BatchDocument.java', summary: 'DefaultStyledDocument 子类，积累 ElementSpec 条目一次批量 insert 快速插入多字符串。appendBatchStringNoLineFeed、appendBatchLineFeed、processBatchUpdates。由 DisplayArea.displayAllClassesNames 类名计数超50时用。标准 Swing 每次触发单独更新致 UI 卡顿；此批文档合并为单结构化插入。包私有性能工具。' },
      { name: 'Doodle', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/doodles/Doodle.java', summary: '返回欢迎 ASCII 艺术字符串的静态门面。当前硬编码委托 SharkBG.SHARKEY。交换涂鸦的门面——改一行即换欢迎艺术(圣诞/SanFran 等)。' },
      { name: 'ChristmasBG', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/doodles/ChristmasBG.java', summary: '圣诞树 ASCII 艺术公共 SHARKEY 常量，归因 angelfire，标"ClassyShark ver. 4.3 Christmas Edition"。包私有类。' },
      { name: 'SanFranBG', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/doodles/SanFranBG.java', summary: '金门大桥 ASCII 艺术公共 SHARKEY 常量，归因 ascii-code.com，标"ClassyShark ver. 6.0 powered by SilverGhost"。公共类。' },
      { name: 'SharkBG', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/displayarea/doodles/SharkBG.java', summary: '鲨鱼 ASCII 艺术包私有 SHARKEY 常量，链接 retrojunkie.com，版本串经 Version.MAJOR/MINOR 动态派生。Doodle.get()默认返回的活动涂鸦。四个涂鸦类形成可插拔欢迎屏内容集。' },
      { name: 'RingChart', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/chart/RingChart.java', summary: '基于 BufferedImage 的旭日图/多级环形图，可视化方法计数树。每环段大小与子节点相对方法计数成比例，降序，小尾部合"Others"。render(width,height,rootNode,G)离屏绘后 blit、renderNode 按深度递归选调色板、getClassNodeAt(x,y)反向查找(读 RGB 映射 colorClassNodeMap)、getHighlightColor(选节点 HSB 饱和度调暗0.7)。两层调色板——顶级9色 PALETTE、L2_PALLETES 每父色7色变体供深度2。命中检测巧妙：扇区色映射 ClassNode，反向查找 getRGB+map get 无几何命中。默认最大深度2。' },
      { name: 'RingChartPanel', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/chart/RingChartPanel.java', summary: 'JPanel 宿主 RingChart 并桥接鼠标事件选/工具提示节点。paint(g)委派 ringChart.render。setRootNode(触发重绘)、getToolTipText(MouseEvent)(显示 key:methodCount)、鼠标移动监听(设 selectedNode 重绘)、鼠标点击(非空子节点调 viewerController.onSelectedMethodCount)。注册 ToolTipManager。悬停→重绘循环。拖放目标(FileTransferHandler)。' },
      { name: 'MethodsCountPanel', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/methodscount/MethodsCountPanel.java', summary: '左侧选项卡托管方法计数 JTree。loadFile(File)分派 NodeWorker SwingWorker。给定文件跑 RootBuilder.fillClassesWithMethods 按包递归建 ClassNode 树，镜像到 DefaultTreeModel。addNodes(ClassNode,DefaultMutableTreeNode)递归镜像。NodeWorker 后台跑 RootBuilder(大 APK 慢)后 EDT 交换树模型。经 CellRenderer/FileTransferHandler 与主树共享主题。选立即推到环形图。' },
      { name: 'Reducer', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/reducer/Reducer.java', summary: '纯函数过滤器(key,allClassNames)->reducedClassNames。key 空返回全部，否则模糊匹配。两模式：子串 indexOf、驼峰(比条目大写字符与键，如 SHC 匹配 StringHashCalculator)。reduce(key)、getAutocompleteClassName(首缩减结果或首类——驱动查看顶级类按钮)、fuzzyReduceClassNames 静态。无状态保留 allClassNames/reducedClassNames。驼峰匹配是 ClassyShark 独特类查找 UX。SilverGhost 和 FilesTree.main 用。' },
      { name: 'Toolbar', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/toolbar/Toolbar.java', summary: '建顶部 JToolBar——打开/后退/查看(下个)/映射/导出/最近/设置/左面板切换按钮+50字输入 typingArea。连每按钮操作调 ToolbarController。buildTypingArea(有选截断发 onChangedTextFromTypingArea)、build各按钮、activateNavigationButtons(存档加载后才启用后退/查看/导出)。所有图标来自 theme.getXxxIcon——主题切换重绘。后退/查看/导出初始禁用，仅 activateNavigationButtons 后启用。main 可视化测试。' },
      { name: 'ToolbarController', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/toolbar/ToolbarController.java', summary: '接口，中介者向工具栏公开回调：onChangedTextFromTypingArea、openArchive、onGoBackPressed、onViewTopClassPressed、onMappingsButtonPressed、onExportButtonPressed、onChangeLeftPaneVisibility、onSettingsButtonPressed。extends ArchiveDisplayer。让 Toolbar 与 ClassySharkPanel 解耦——工具栏只见8回调非整个面板/SilverGhost。' },
      { name: 'RecentArchivesButton', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/toolbar/RecentArchivesButton.java', summary: 'JButton 点击开 JPopupMenu 列 RecentArchivesConfig 的最近存档+"清除"项。popupMenuWillBecomeVisible 时重建项列表反映当前配置。buildPopup(填充项+清除分隔符)、setPanel(ToolbarController)、RecentFilesListener(displayArchive)、MousePopupListener、PopupPrintListener(打开时重建)。弹出每次打开重建——新开存档立即出现无需重启。委托 ArchiveDisplayer.displayArchive 复用同加载路径。' },
      { name: 'KeyUtils', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/toolbar/KeyUtils.java', summary: 'KeyEvent 分类静态工具：isDeletePressed(键码8)、isLeftArrowPressed(37)、isRightArrowPressed(39)、isCommandKeyPressed(157)、isLetterOrDigit。原始数字键码(非 KeyEvent.VK_* 常量)是小代码异味。由 ClassySharkPanel.keyPressed 驱动键盘导航(左=打开，右/Cmd=查看顶级类，字母数字=追加过滤，Delete=退格)。' },
      { name: 'CurrentFolderConfig', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/io/CurrentFolderConfig.java', summary: '单例枚举(INSTANCE)，磁盘 classyshark.properties 以 CURRENT_FOLDER 键持久化文件选择器"当前目录"。setCurrentDirectory、getCurrentDirectory(失败回退 user.home)。基于 Properties 文件工作目录旁边。enum 单例序列化安全。所有异常吞掉(静默回退)——配置不可读 UI 仍工作。无路径抽象，配置位置依 CWD。' },
      { name: 'FileChooserUtils', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/io/FileChooserUtils.java', summary: '静态工具：acceptFile、getFileChooserDescription(返回"dex, jar, apk, class, aar")、isSupportedArchiveFile 匹配 .dex .jar .zip .apk .class .aar。支持扩展名单一事实源——ClassySharkPanel.openArchive 的 JFileChooser 过滤器和 FileTransferHandler 拖放接受器共。注意 .zip 受支持但 TranslatorFactory 无 .zip 路由——已知不一致。' },
      { name: 'RecentArchivesConfig', path: 'ClassySharkWS/src/com/google/classyshark/gui/panel/io/RecentArchivesConfig.java', summary: '单例枚举，classyshark_recents.properties 以存档名为键、父目录为值持久化最近存档。addArchive、clear、getRecentArchiveNames(排序后)、getFilePath(name)。与 CurrentFolderConfig 同 Properties 存储风格。getRecentArchiveNames 按字典序排序(非最近性)——顺序非 LRU。由 RecentArchivesButton 用。' },
      { name: 'SettingsFrame', path: 'ClassySharkWS/src/com/google/classyshark/gui/settings/SettingsFrame.java', summary: '小模态 JFrame 带主题选择 JComboBox。从 ThemeManager.getThemes() 填充，选当前主题索引，附加 ThemeChosenListener。极简——200x80 不可调。从 ClassySharkPanel.onSettingsButtonPressed 实例化。标签提示"下次启动生效"——当前主题运行时不热切换，选择持久化下次启动应用。' },
      { name: 'ThemeChosenListener', path: 'ClassySharkWS/src/com/google/classyshark/gui/settings/ThemeChosenListener.java', summary: '组合框 ActionListener，经 ThemeManager.saveCurrentTheme(theme) 保存选定主题后关设置窗口。构造时捕获 JFrame root 关闭。轻量无状态(除根框引用)。持久化主题选择处——GUI 其余启动时经 ThemeManager.getCurrentTheme() 读。' },
    ]
  },
  {
    subsystem: 'Theme + Analytics + Updater + Android',
    classes: [
      { name: 'Theme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/Theme.java', summary: '定义主题契约的接口：8个 ImageIcon 获取器(切换/最近/后退/前进/打开/导出/映射/设置)和7个 Color 获取器(默认/关键字/标识符/注解/选背景/名称/背景)。extends SwingThemeApplier<Component> 故主题须实现 applyTo(Component)。每个 *Theme 具体类须履行。颜色获取器映射 DisplayArea.fillTokensToDoc 用的语义角色——加新语法角色须加 getter+两实现。' },
      { name: 'ThemeManager', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/ThemeManager.java', summary: '静态注册表，classyshark_ui.properties 以类名(Theme 键)持久化选定主题并反射 rehydrate。维护硬编码 {"Light","Dark"} 显示数组并在显示索引和主题实例间转。getCurrentTheme(读属性 Class.forName(theme).newInstance() 失败回退 DarkTheme)、saveCurrentTheme、getThemes、getThemeIndexFrom、getThemeFrom。按类名持久化——加新主题只需实现 Theme 的类且选择可重启存活，但须无参构造。默认回退 DarkTheme 非 Light——全新安装深色。' },
      { name: 'SwingThemeApplier', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/SwingThemeApplier.java', summary: '通用函数式接口 SwingThemeApplier<T>{void applyTo(T component);}。Theme extends SwingThemeApplier<Component> 继承 applyTo。将"应用到 Swing 组件"方面与颜色/图标获取器方面分离。允许类型化变体尽管 Theme 绑 Component。' },
      { name: 'DarkTheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/dark/DarkTheme.java', summary: '具体深色主题。构造从 DarkIconScheme 路径加载8图标，设 MenuItem.foreground UI 为标识符色，实现 applyTo(Component) 为 JTree/JTextField/JMenuItem/JPopupMenu 分配较亮背景(BACKGROUND_LIGHT)否则默认深背景+为 JLabel/JTextField 着前景。真正在组件级自定义 Swing 外观(浅色不)。两种背景让树/文本字段稍亮提深度。静态导入 DarkColorScheme/DarkIconScheme。' },
      { name: 'DarkColorScheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/dark/DarkColorScheme.java', summary: '深色调色板 Color 常量持有者：BACKGROUND(32,32,32)、BACKGROUND_LIGHT(46,48,50)、IDENTIFIERS(黄)、DEFAULT(浅灰)、KEYWORDS(绿)、ANNOTATIONS(紫)、SELECTION_BG(蓝绿)、NAMES(棕)。纯数据类私有构造。类 Solarized 风格深色调色板——值得复现十六进制定义标志性深色外观。' },
      { name: 'DarkIconScheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/dark/DarkIconScheme.java', summary: '8工具栏图标路径常量公共类，从类路径 /resources/ic_*.png 加载。当前与 LightIconScheme 路径同——框架允许每主题不同图标集但两主题共享同 PNG。扩展点：可加深色变体图标无需改主题代码。' },
      { name: 'LightTheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/light/LightTheme.java', summary: '具体浅色主题。构造加载图标(LightIconScheme 同路径)，颜色 getter 返 LightColorScheme 常量，getBackgroundColor 返 Color.WHITE，applyTo(Component) 是空操作("不希望覆盖浅色主题的系统默认值")。与 DarkTheme 非对称是刻意的——浅色让系统原生 LAF 透出，深色覆盖全部。浅色外观因平台而异，深色处处同。文档应强调刻意非对称。' },
      { name: 'LightColorScheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/light/LightColorScheme.java', summary: '浅色调色板 Color 常量持有者：DEFAULT(基础石板灰)、KEYWORDS(黄/橄榄)、IDENTIFIERS(绿橄榄)、ANNOTATIONS(紫)、SELECTION_BG(蓝绿)、NAMES(浅石板灰)。无 BACKGROUND 常量(LightTheme 硬编码 Color.WHITE)。明显类 Solarized 浅色——与深色同色相系列调适白背景。深浅共用同 SELECTION_BG 蓝绿。' },
      { name: 'LightIconScheme', path: 'ClassySharkWS/src/com/google/classyshark/gui/theme/light/LightIconScheme.java', summary: 'DarkIconScheme 结构镜像——8图标路径常量指同 /resources/ic_*.png。冗余但与深色变体对称，故浅色主题未来可带不同图标资源集无需重构 LightTheme。' },
      { name: 'Analytics', path: 'ClassySharkWS/src/com/google/classyshark/analytics/Analytics.java', summary: '单例枚举门面，addActivation() 创建 JGoogleAnalyticsTracker(UA-91889970-1, ClassyShark-Activation, 版本来自 Version) 异步上报一次 Activation 事件。极简入口把跟踪细节全封装。Main.main 调用。' },
      { name: 'FocusPoint', path: 'ClassySharkWS/src/com/google/classyshark/analytics/FocusPoint.java', summary: '跟踪事件数据模型，支持父子层级(parentFocusPoint)。getContentURI 递归拼接父节点名(/ 分隔)、getContentTitle 用 - 分隔，均做 UTF-8 URL 编码。树形事件结构，递归生成 GA utmp/utmdt 参数。' },
      { name: 'GoogleAnalytics_v1_URLBuildingStrategy', path: 'ClassySharkWS/src/com/google/classyshark/analytics/GoogleAnalytics_v1_URLBuildingStrategy.java', summary: '构建 Urchin/GA v1 __utm.gif 跟踪 URL。硬编码屏幕分辨率 1440x900、32-bit 色等假数据，生成 cookie/random/timestamp。老式 urchin.js 协议纯 Java 实现，值得说明历史背景和与 modern GA 差异。实现 URLBuildingStrategy。' },
      { name: 'HTTPGetMethod', path: 'ClassySharkWS/src/com/google/classyshark/analytics/HTTPGetMethod.java', summary: '执行 HTTP GET 上报。构造 Java/<version> (<os.arch>; <os.name> <os.version>) User-Agent。静态延迟初始化 UA 串，经 LoggingAdapter 解耦日志，响应非 200 记错误但不抛(静默失败)。' },
      { name: 'JGoogleAnalyticsTracker', path: 'ClassySharkWS/src/com/google/classyshark/analytics/JGoogleAnalyticsTracker.java', summary: '核心跟踪器，组合 URLBuildingStrategy+HTTPGetMethod。trackSynchronously 和 trackAsynchronously(内部 TrackingThread MIN_PRIORITY)。Setter 注入策略与日志适配器。异步线程低优先级避免影响主应用性能。基于第三方 jgoogleanalytics(Siddique Hameed)。' },
      { name: 'LoggingAdapter', path: 'ClassySharkWS/src/com/google/classyshark/analytics/LoggingAdapter.java', summary: '日志接口，logError+logMessage 两方法。允许接入 log4j/System.out 等。' },
      { name: 'URLBuildingStrategy', path: 'ClassySharkWS/src/com/google/classyshark/analytics/URLBuildingStrategy.java', summary: 'URL 构建策略接口，buildURL(FocusPoint)+setRefererURL。策略模式抽象。' },
      { name: 'UpdateManager', path: 'ClassySharkWS/src/com/google/classyshark/updater/UpdateManager.java', summary: '单例门面，checkVersionConsole()/checkVersionGui() 两入口，按 isGui 选 GuiDownloader 或 CliDownloader。桥接模式统一更新流程不同 UI 表现。' },
      { name: 'Release', path: 'ClassySharkWS/src/com/google/classyshark/updater/models/Release.java', summary: 'GitHub latest release 响应 Gson 模型，字段 @SerializedName 映射(prerelease、created_at)。无参构造用当前 Version 构造"自身版本"作比较基准。isNewerThan 按 major.minor 数值比较。getDownloadURL 取 assets[0]。Release 自身作版本比较双角色(基准 vs 远端)。' },
      { name: 'ReleaseDownloadData', path: 'ClassySharkWS/src/com/google/classyshark/updater/models/ReleaseDownloadData.java', summary: 'Release asset 包级私有模型，仅持 browser_download_url。包私有可见性仅模型层内部用。' },
      { name: 'AbstractDownloader', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/AbstractDownloader.java', summary: 'GuiDownloader/CliDownloader 骨架，继承 AbstractReleaseCallback。checkNewVersion 经 Retrofit 异步 enqueue，onReleaseReceived 在新线程先 warnAboutNew 询问再下载。模板方法——warnAboutNew 和 onReleaseDownloaded 为抽象钩子由子类决定交互。' },
      { name: 'AbstractReleaseCallback', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/AbstractReleaseCallback.java', summary: 'Retrofit Callback<Release> 抽象适配，onResponse 转发到 onReleaseReceived，onFailure 打错误。把 Retrofit 回调简化为业务语义回调。' },
      { name: 'CliDownloader', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/CliDownloader.java', summary: 'CLI 下载器，warnAboutNew 用 System.out+Scanner 问 y/N。下载完成打印路径。同步式交互阻塞读 stdin。继承 AbstractDownloader。' },
      { name: 'GuiDownloader', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/GuiDownloader.java', summary: 'GUI 下载器，warnAboutNew 直接返 true(不问)，下载完成 EDT 上 SwingUtilities.invokeLater(MessageRunnable) 弹 JOptionPane。Swing 线程安全，无确认直接下载。继承 AbstractDownloader。' },
      { name: 'GitHubApi', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/GitHubApi.java', summary: 'Retrofit 接口，定义 GET repos/google/android-classyshark/releases/latest，endpoint https://api.github.com/。声明式 API 描述。' },
      { name: 'MessageRunnable', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/MessageRunnable.java', summary: 'Runnable，构建标题/changelog 文案在 JOptionPane 展示带图标更新提示。把 UI 弹窗逻辑从 GuiDownloader 分离可复用。' },
      { name: 'NetworkManager', path: 'ClassySharkWS/src/com/google/classyshark/updater/networking/NetworkManager.java', summary: 'Retrofit 工厂，用 Gson 转换器构建 GitHubApi 实例。单一职责工厂方法。' },
      { name: 'FileUtils', path: 'ClassySharkWS/src/com/google/classyshark/updater/utils/FileUtils.java', summary: '文件下载与管理。downloadFileFrom 幂等(已存在跳过)用 NIO Channels.transferFrom 下载。overwriteOld(私有似未调用)用 Files.copy(REPLACE_EXISTING) 覆盖旧 jar。幂等下载避免重复，NIO 零拷贝式传输。' },
      { name: 'NamingUtils', path: 'ClassySharkWS/src/com/google/classyshark/updater/utils/NamingUtils.java', summary: '为新 release 生成文件名 ClassyShark_<createdAt-date>.jar 放当前工作目录。extractCurrentPath 返回规范化绝对当前路径。用 createdAt 时间戳区分版本文件保留旧版本不覆盖。' },
      { name: 'Version', path: 'ClassySharkWS/src/com/google/classyshark/Version.java', summary: '常量类，MAJOR=8、MINOR=2，被 Analytics、Release(作基准)等多处引用。全局版本单一来源。' },
      { name: 'MainActivity', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/activities/MainActivity.java', summary: '入口 Activity，用 queryIntentActivities 枚举设备所有 launcher 应用填 ListView。点击某 app 后将其 APK 路径(publicSourceDir)作 Uri 传 ClassesListActivity。经 PackageManager 反射式枚举已安装应用。内部 AppListNode implements Comparable 按名排序。' },
      { name: 'ClassesListActivity', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/activities/ClassesListActivity.java', summary: '核心 Activity。两并发线程：FillClassesNamesThread 用 DexFile.loadDex 枚举类名填列表；StartDexLoaderThread 用 DexClassLoader 加载 dex 以便反射。点击类名用 Reflector 生成类"源码"dump 传 SourceViewerActivity。双线程分离"列出类"与"加载可反射类"。ODEX 不支持时 Toast 提示。ProgressDialog 显示加载状态。' },
      { name: 'SourceViewerActivity', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/activities/SourceViewerActivity.java', summary: '用 WebView+Google code-prettify(run_prettify.js, sons-of-obsidian 皮肤)高亮显示类 dump 文本。用 Guava HtmlEscapers 转义内容。复用 JS 语法高亮库而非自己实现，黑色背景配合主题。' },
      { name: 'StableArrayAdapter', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/adapters/StableArrayAdapter.java', summary: 'ArrayAdapter<String> 子类，用 HashMap 维护 name→position 映射，hasStableIds() 返 true。解决列表数据变化时 ID 不稳定问题，Android 经典模式。' },
      { name: 'DexLoaderBuilder', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/dex/DexLoaderBuilder.java', summary: '构建 DexClassLoader 的工厂。从字节流写入 app 私有目录 internal.dex 再 DexClassLoader 加载，加载后删临时 dex。把内存中 dex 字节落盘 getDir("dex") 再加载，绕过 DexClassLoader 需文件路径限制，加载后立即删 dex 释放空间。' },
      { name: 'Reflector', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/reflector/Reflector.java', summary: '经 Java 反射将 Class 重建为类 Java 源码文本。generateClassData 依次输出 package、imports(从字段/构造器/方法参数类型收集依赖)、class 声明、字段、构造器、方法签名(方法体 { ... })。TaggedWord+TAG 枚举(MODIFIER/IDENTIFIER/DOCUMENT)为语法高亮预留标注。用 Hashtable 收集依赖类型。复刻 JAD 风格 stub 反编译。' },
      { name: 'ClassesNamesList', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/reflector/ClassesNamesList.java', summary: '简单 LinkedList 包装，持类名列表并提供按位置获取。纯数据容器。' },
      { name: 'ClassTypeAlgorithm', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/reflector/ClassTypeAlgorithm.java', summary: '递归解析 JVM 类型签名(含数组前缀 [ 和基本类型描述符 I/V/C/D/F/J/S/Z/B/L...;)为 Java 源码形式，传 Hashtable 时记录引用类型用于 imports。处理反射返回的 JNI 风格类型名，是 Reflector 的类型翻译核心。' },
      { name: 'IOUtils', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/utils/IOUtils.java', summary: 'IO 工具：toByteArray(InputStream→byte[])、bytesToFile、copy/copyLarge。标准 4KB 缓冲流拷贝，Apache Commons IO 风格精简实现。' },
      { name: 'UriUtils', path: 'ClassySharkAndroid/app/src/main/java/com/google/classysharkandroid/utils/UriUtils.java', summary: 'Uri 工具：getStreamFromUri 经 ContentResolver 开输入流；isAttach 判是否 content scheme。抽象 content:// 与 file:// 差异。' },
    ]
  },
]

phase('生成模块文档批次2')

const results = await parallel(batches.map(b => () =>
  agent(TPL + `【本次处理的子系统】${b.subsystem}\n\n【类清单】\n` +
    b.classes.map(c => `- 类名: ${c.name}\n  源码路径: ${c.path}\n  调研摘要: ${c.summary}`).join('\n\n') +
    `\n\n请逐一 Read 每个源码文件，按模板写出 ${b.classes.length} 个 Markdown 文件到 website/reference/modules/。`,
    { label: `${b.subsystem}(${b.classes.length}类)`, phase: '生成模块文档批次2' }
  ).then(r => ({ subsystem: b.subsystem, count: b.classes.length, result: r }))
))

const ok = results.filter(Boolean)
log(`批次2完成 ${ok.length}/${batches.length} 个子系统，共 ${ok.reduce((s,b)=>s+b.count,0)} 篇模块文档`)
return ok