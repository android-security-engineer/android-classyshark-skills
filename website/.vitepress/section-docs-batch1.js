export const meta = {
  name: 'produce-section-docs',
  description: '为 ClassyShark 文档站生成 guide/tutorials/cli/gui/api/deployment/contributing/architecture 各 section 文档',
  phases: [{ title: '生成 section 文档', detail: '每个 agent 负责 1-2 个 section' }],
}

const STYLE = `你正在为 android-classyshark 项目的 VitePress 文档站写 section 文档（非模块文档）。

【通用写作要求】
1. 简体中文。
2. 多用 emoji 图标（🦈🛠️🖥️📚🧩🚀📦📊🔍⚠️✅❌等）。
3. 每页顶部用 VitePress Badge 组件：<Badge type="tip" text="指南" /> <Badge type="info" text="xxx" />。
4. 用表格、代码块、mermaid 图增强可读性。
5. 内部链接用相对路径，如 [CLI 参考](/cli/index)、[Main 模块](/reference/modules/Main)。
6. 基于真实的 ClassyShark 架构（仓库根 /home/cc11001100/github/android-security-engineer/android-classyshark-skills）。可 Read 实际源码确认细节。
7. 每篇 60-180 行，信息密度高，不灌水。

【项目背景】ClassyShark 是 Google 开源 Android 二进制检查工具。架构：Main→CliMode/GuiMode/Shark→SilverGhostFacade/SilverGhost→ContentReader(按格式解析)+TranslatorFactory(按扩展名分发 Translator)。CLI 命令：-open/-export/-inspect/-methodcounts/-update。Shark API：with(File).getGeneratedClass/getAllClassNames/getManifest/getAllMethods/getAllStrings/isMultiDex/isCustomMultiDex。已存在的标杆文档可参考风格：website/guide/what-is-classyshark.md, website/guide/quick-start.md, website/guide/architecture-overview.md, website/guide/concepts/dex.md。

【参考的模块文档路径】reference/modules/ 下每个类一篇，链接形如 /reference/modules/TranslatorFactory。

请严格按下方每个文件的【内容要求】写出对应 Markdown 文件到指定绝对路径。

`

const docs = [
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/jar-aar.md',
    req: 'JAR 与 AAR 概念。JAR=Java ARchive(zip of .class)，AAR=Android ARchive(zip of classes.jar+AndroidManifest.xml+res+R.txt+assets)。说明 ClassyShark 如何处理：JarReader 流式遍历 JarEntry 提取类名并检测 native lib；AarReader 解压找内嵌 classes.jar 写临时文件委托 JarReader，并把 AndroidManifest.xml 作为"类名"加入列表供查看。链接 /reference/modules/JarReader、AarReader、JarInfoTranslator。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/elf-so.md',
    req: 'ELF 与 .so 概念。ELF=Executable and Linkable Format，Android native 库(.so)是 ELF 共享库。说明 .so 含 .dynsym 动态符号表、DT_NEEDED 依赖、SONAME。ClassyShark 用 ElfTranslator 读：nl.lxtreme.binutils.elf.Elf 读依赖(DT_NEEDED)，自研 ElfReader(穷人的readelf)读动态符号，经 SherlockHash 缓存提取。已知限制：ElfReader 仅 ELFCLASS32，64位抛 ELFCLASS64，故 arm64-v8a 的 .so 部分受限。DynamicSymbolsInspector 检查缺 SONAME 和 text relocation。链接 /reference/modules/ElfReader、ElfTranslator、DynamicSymbolsInspector、SherlockHash。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/binary-xml.md',
    req: '二进制 XML 概念。Android 构建时把 AndroidManifest.xml 和 res/ 下的 XML 编译成二进制格式(AOSP ResourceTypes.h 定义)以省空间加速解析，文本编辑器打不开。ClassyShark 的 XmlDecompressor 是独立于 AOSP aapt 的自研解码器：小端读块类型(PACKED_XML_IDENTIFIER=0x00080003)，解析字符串池(UTF-8/UTF-16LE)，遍历开始/结束元素和 CDATA，解码类型化属性值(引用/字符串/浮点/维度/分数/int-dec/hex/boolean)。ATTRS_MARKER=0x00140014。强调这是高技术量量的独立实现。AndroidXmlTranslator 调用它，XmlHighlighter 正则分词做高亮。链接 /reference/modules/XmlDecompressor、AndroidXmlTranslator、XmlHighlighter。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/multidex.md',
    req: 'Multidex 概念。单个 DEX 方法 ID 上限 65535，超限需拆多 dex：classes.dex/classes2.dex/classes3.dex。两种方式：1)自动 multidex(Android Gradle 插件生成 classes2.dex 等)；2)自定义 dex 加载(应用运行时动态加载 dex)。ClassyShark 的 SilverGhostFacade.isMultiDex 检测≥2个dex条目；isCustomMultiDex 检测含 classes1.dex 或非 classes 前缀的 dex。MultidexReader 扫描 APK 内所有 classes*.dex 及嵌入 jar/zip 内的动态 dex(用###连接内外条目名)。哨兵索引99/999。链接 /reference/modules/SilverGhostFacade、MultidexReader、DexReader。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/method-counts-65k.md',
    req: '方法数 65k 限制概念。单个 DEX 方法 ID 用 16 位索引上限 65535，应用+依赖方法数超限需 multidex。这是 Android 早期著名痛点。ClassyShark 解决：RootBuilder 按包建方法计数树(aar/jar 用 BCEL，dex/apk 用 dexlib2 ClassDef.getMethods())；ClassNode 递归累加形成按包聚合计数；GUI 用 RingChart 旭日图可视化按包方法占比；CLI 用 -methodcounts(树形,Unicode box-drawing)或 -flat(扁平全限定名)。Exporter 导出 method_counts.txt。链接 /reference/modules/RootBuilder、ClassNode、RingChart、TreeMethodCountExporter、FlatMethodCountExporter、Exporter。给一个 -methodcounts 命令示例。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/proguard-mapping.md',
    req: 'ProGuard 映射概念。ProGuard/R8 混淆把类名方法名缩短(如 com.foo.Bar→a.b.c)，构建产物产 mapping.txt 记录混淆前→混淆后映射。逆向分析需反混淆。ClassyShark 的 TokensMapper 是符号重映射 SPI：readMappings(File)返回构建的映射器，getReverseClasses()返回混淆→原始类名映射。SilverGhost.addMapper/addMappings 让 JavaTranslator 把 MetaObject 包进 MetaObjectWithMapper 装饰器，在呈现时用 reverse 映射替换 getName()。默认实现 IdentityMapper(无操作)。GUI 有"映射"按钮触发。链接 /reference/modules/TokensMapper、IdentityMapper、MetaObjectWithMapper、SilverGhost。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/concepts/reflect-vs-asm-vs-dexlib.md',
    req: '反射 vs ASM vs dexlib2 三路 MetaObject 策略。JavaTranslator 把类渲染成源码存根，依赖 MetaObject 抽象，由 MetaObjectFactory 在三路间自动选择：1)MetaObjectClass(反射，运行时 Class 可加载时优先，泛型信息最全——唯一发 <T,U> 泛型)；2)MetaObjectAsmClass(ASM 字节码，依赖缺失反射 NoClassDefFoundError 时兜底，始终可用但无泛型)；3)MetaObjectDex(dexlib2 ClassDef，类从 APK/DEX 加载时用，含 EmptyClassDef 空对象防 NPE，无泛型)。分发规则：.jar→反射优先ASM兜底，.class→ASM，.dex/.apk→MetaObjectDex，.aar→提取内嵌jar递归。用 mermaid 画决策流程。链接 /reference/modules/MetaObjectFactory、MetaObject、MetaObjectClass、MetaObjectAsmClass、MetaObjectDex、ClassDetailsFiller、ClassUtils。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/faq.md',
    req: 'FAQ。8-12 个常见问题：1)如何打开 APK？拖入或 -open；2)方法数怎么看？-methodcounts 或环形图；3)支持 .so 吗？支持但仅32位ELF；4)能反混淆吗？加载 ProGuard mapping；5).zip 为何行为异常？已知限制(TranslatorFactory无.zip分支)；6)如何导出数据？-export；7)能作为库用吗？Shark API；8)需要装 Android SDK 吗？不需要，纯 Java；9)深色主题怎么切？设置→主题(下次启动生效)；10)统计上报能关吗？Analytics 相关说明。每问简明回答+链接。'
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/troubleshooting.md',
    req: "故障排查。6-8 个场景：1)java -jar 报错 NoClassDefFound→检查 Java 版本≥8；2)打开 APK 空白→可能仅 manifest 的错误 APK(isArchiveError)；3)-export 报 couldn't write file→权限；4)native 库显示不全→64位 .so 不支持(ElfReader ELFCLASS32)；5)GUI 卡顿大 APK→正常，SwingWorker 后台处理，类名>50走 BatchDocument 快速路径；6)主题不生效→下次启动才应用(SettingsFrame)；7)反射加载类失败→自动回退 ASM(MetaObjectFactory)；8)最近文件顺序怪→按字典序非LRU(RecentArchivesConfig 已知问题)。每条给原因+解决+链接模块。"
  },
  {
    file: '/home/cc11001100/github/android-security-engineer/android-classyshark-skills/website/guide/glossary.md',
    req: '术语表。表格形式 15-20 个术语：APK/DEX/Dalvik/ART/Multidex/65k限制/ProGuard/R8/混淆/反混淆/ELF/SONAME/二进制XML/ResourceTypes/Accessors(合成访问器)/Manifest/Receiver/隐式广播/NDK/AAR/JAR/ASM/dexlib2/asmdex/BCEL/SPI/Facade/Decorator/Null Object。每条1-2句解释。'
  },
]

phase('生成 section 文档 - guide概念与参考')

const r1 = await parallel(docs.map(d => () =>
  agent(STYLE + `【文件路径】${d.file}\n【内容要求】${d.req}`,
    { label: d.file.split('/').pop(), phase: '生成 section 文档 - guide概念与参考' }
  ).then(r => ({ file: d.file, ok: r ? true : false }))
))

const ok1 = r1.filter(Boolean).filter(r => r.ok)
log(`guide 概念/参考完成 ${ok1.length}/${docs.length}`)

return { guideDone: ok1.length, total: docs.length }
