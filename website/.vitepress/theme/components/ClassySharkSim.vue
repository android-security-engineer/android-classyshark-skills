<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ============ 真实演示数据（com.apkpure.aegon-3.20.7803.apk 实际分析结果）============
const DEMO = {
  name: 'com.apkpure.aegon-3.20.7803.apk',
  size: '24 MB',
  dexes: [
    { name: 'classes.dex', methods: 65528, pct: 65.5, nearLimit: true },
    { name: 'classes2.dex', methods: 65310, pct: 65.3, nearLimit: true },
    { name: 'classes3.dex', methods: 48293, pct: 48.3, nearLimit: false }
  ],
  totalClasses: 33655,
  totalMethods: 179131,
  dexLimit: 65536,
  nativeLibs: [
    'libBugly_Native.so', 'libapminsight.so', 'libmmkv.so', 'libqmp.so',
    'libpglarmor.so', 'libnrb.so', 'libnms.so', 'libqsealib.so',
    'libhttpdns.so', 'librmonitor.so', 'libhydeviceid.so', 'libtt_ugen.so'
  ],
  nativeLibCount: 42,
  manifestIssues: [
    'ACTION_POWER_CONNECTED → ConstraintProxy$BatteryChargingProxy',
    'BATTERY_LOW → ConstraintProxy$BatteryNotLowProxy',
    'PACKAGE_ADDED → com.san.core.receiver.AppPkgReceiver',
    'CONNECTIVITY_CHANGE → ConstraintProxy$NetworkStateProxy',
    'C2DM RECEIVE → FirebaseInstanceIdReceiver'
  ],
  manifestIssueCount: 8
}

// ============ 代码片段（点击功能树后展示，含语法高亮 span）============
const MAIN_HTML = `<span class="tok-kw">package</span> com.apkpure.aegon;

<span class="tok-kw">public</span> <span class="tok-kw">class</span> <span class="tok-cls">MainActivity</span> <span class="tok-kw">extends</span> <span class="tok-cls">BaseActivity</span> {
  <span class="tok-kw">@Override</span>
  <span class="tok-kw">protected</span> <span class="tok-kw">void</span> <span class="tok-fn">onCreate</span>(Bundle b) {
    <span class="tok-kw">super</span>.<span class="tok-fn">onCreate</span>(b);
    <span class="tok-fn">setContentView</span>(R.layout.activity_main);
    <span class="tok-cmt">// 依次初始化各家第三方 SDK</span>
    <span class="tok-cls">Bugly</span>.<span class="tok-fn">init</span>(<span class="tok-kw">this</span>, <span class="tok-str">"a8f2c91d"</span>);
    <span class="tok-cls">MMKV</span>.<span class="tok-fn">initialize</span>(<span class="tok-kw">this</span>);
  }
}`

const MMKV_HTML = `<span class="tok-kw">package</span> com.tencent.mmkv;
<span class="tok-kw">import</span> android.content.SharedPreferences;

<span class="tok-kw">public</span> <span class="tok-kw">class</span> <span class="tok-cls">MMKV</span> <span class="tok-kw">implements</span> <span class="tok-cls">SharedPreferences</span> {
  <span class="tok-kw">private</span> <span class="tok-kw">static</span> MMKVHandler gCallbackHandler;
  <span class="tok-kw">private</span> <span class="tok-kw">long</span> handle;

  <span class="tok-kw">public</span> <span class="tok-kw">static</span> <span class="tok-cls">MMKV</span> <span class="tok-fn">defaultMMKV</span>() {
    <span class="tok-kw">return</span> getRootDir() != <span class="tok-kw">null</span>
        ? <span class="tok-fn">mmkvWithID</span>(DEFAULT_MMAP_ID) : <span class="tok-kw">null</span>;
  }

  <span class="tok-kw">public</span> <span class="tok-kw">boolean</span> <span class="tok-fn">putString</span>(String key, String value) {
    <span class="tok-kw">return</span> <span class="tok-fn">encodeString</span>(key, value);
  }
  <span class="tok-kw">private</span> <span class="tok-kw">native</span> <span class="tok-kw">boolean</span> <span class="tok-fn">encodeString</span>(String key, String value);
  <span class="tok-kw">private</span> <span class="tok-kw">native</span> String <span class="tok-fn">decodeString</span>(String key);
}`

const BUGLY_HTML = `<span class="tok-kw">package</span> com.tencent.bugly;

<span class="tok-kw">public</span> <span class="tok-kw">class</span> <span class="tok-cls">Bugly</span> {
  <span class="tok-kw">public</span> <span class="tok-kw">static</span> <span class="tok-kw">void</span> <span class="tok-fn">init</span>(Context ctx, String appId) {
    <span class="tok-cmt">// 注册全局未捕获异常回调，把堆栈上传云端</span>
    Thread.<span class="tok-fn">setDefaultUncaughtExceptionHandler</span>(
        <span class="tok-kw">new</span> <span class="tok-cls">BuglyUncaughtExceptionHandler</span>(appId));
  }
}`

const BYTE_HTML = `<span class="tok-kw">package</span> com.bytedance.sdk;

<span class="tok-kw">public</span> <span class="tok-kw">class</span> <span class="tok-cls">AdManager</span> {
  <span class="tok-kw">public</span> <span class="tok-kw">static</span> <span class="tok-kw">void</span> <span class="tok-fn">registerSystemReceiver</span>(Context ctx) {
    IntentFilter f = <span class="tok-kw">new</span> <span class="tok-cls">IntentFilter</span>();
    f.<span class="tok-fn">addAction</span>(Intent.ACTION_POWER_CONNECTED);
    f.<span class="tok-fn">addAction</span>(Intent.ACTION_NETWORK_CHANGED);
    f.<span class="tok-fn">addAction</span>(Intent.ACTION_PACKAGE_ADDED);
    ctx.<span class="tok-fn">registerReceiver</span>(<span class="tok-kw">new</span> <span class="tok-cls">ConstraintProxy</span>(), f);
  }
}`

const NATIVE_HTML = `<span class="tok-cmt">// libmmkv.so — MMKV 的 C++ 核心（arm64-v8a）</span>
<span class="tok-kw">extern</span> <span class="tok-str">"C"</span> JNIEXPORT jboolean JNICALL
Java_com_tencent_mmkv_MMKV_<span class="tok-fn">encodeString</span>(
    JNIEnv* env, jobject thiz, jstring key, jstring value) {
  <span class="tok-cmt">// mmap 映射文件，写入后强制落盘</span>
  <span class="tok-kw">return</span> mmkv-><span class="tok-fn">encodeString</span>(key, value);
}`

// ============ 功能树 ============
const TREE_NODES = [
  { id: 'main',     name: 'com.apkpure.aegon.MainActivity', ic: '🏠', type: '主入口 · App 启动流程',     danger: false, desc: 'App 的主界面入口，能看到它在启动时初始化了哪些第三方 SDK。', code: MAIN_HTML },
  { id: 'mmkv',     name: 'com.tencent.mmkv.MMKV',          ic: '📦', type: '存储组件 · 腾讯开源',       danger: false, desc: '腾讯开源的高性能键值存储，App 用它保存配置和缓存数据。',       code: MMKV_HTML },
  { id: 'bugly',    name: 'com.tencent.bugly.Bugly',        ic: '🛰️', type: '崩溃上报 · 腾讯',          danger: true,  desc: '崩溃日志上报 SDK，注册全局异常回调把堆栈上传到云端。',       code: BUGLY_HTML },
  { id: 'bytedance',name: 'com.bytedance.sdk.AdManager',    ic: '📡', type: '广告 SDK · 字节跳动',      danger: true,  desc: '广告组件，注册了系统事件监听，App 退到后台也会被唤醒。',     code: BYTE_HTML },
  { id: 'native',   name: 'libmmkv.so',                     ic: '🧬', type: '原生库 · arm64-v8a',        danger: false, desc: 'MMKV 的 JNI 原生实现，压缩存储由 C++ 完成，性能更高。',     code: NATIVE_HTML }
]
const selNode = computed(() => TREE_NODES.find(n => n.id === sel.value) ?? TREE_NODES[0])

// ============ 状态栏 ============
const STATUS = [
  { l: '待命',     m: '已加载 APK · com.apkpure.aegon-3.20.7803.apk', r: '24 MB' },
  { l: '拆包中',   m: '发现 33,655 个类 · 179,131 个方法',             r: '42 家第三方待识别' },
  { l: '分析完成', m: '识别 42 家第三方 · 8 处安全隐患',               r: '耗时 4.2s ✓' }
]

// ============ 播放控制：自动演示可随时被用户接管 ============
const phase = ref(0)          // 0=看不懂  1=帮你看懂  2=看懂了
const visible = ref(false)
const started = ref(false)
const autoplay = ref(true)    // 进入视野后先自动演示一遍；用户一动手就停
const sel = ref('main')

let observer: IntersectionObserver | null = null
let autoTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    const e = entries[0]
    if (e.isIntersecting) {
      visible.value = true
      if (!started.value) {
        started.value = true
        startAuto()
      }
    } else {
      visible.value = false
    }
  }, { threshold: 0.25 })
  const el = document.getElementById('cs-home-demo')
  if (el) observer.observe(el)
})

function startAuto() {
  stopAuto()
  autoTimer = setInterval(() => {
    if (!visible.value || !autoplay.value) return
    phase.value = phase.value >= 2 ? 0 : phase.value + 1
  }, 3200)
}

function stopAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null }
}

// 用户手动切阶段：接管自动演示
function go(n: number) {
  stopAuto()
  autoplay.value = false
  phase.value = n
}

// 用户点击功能树：接管自动演示并切换源码
function pick(id: string) {
  stopAuto()
  autoplay.value = false
  sel.value = id
}

// 标题栏上的自动演示开关
function toggleAuto() {
  if (autoplay.value) {
    autoplay.value = false
    stopAuto()
  } else {
    autoplay.value = true
    startAuto()
  }
}

onUnmounted(() => {
  if (observer) observer.disconnect()
  stopAuto()
})

function formatNum(n: number): string {
  return n.toLocaleString('en-US')
}

// 环形图：每段弧按累计占比旋转定位
function segRotate(cumOffsetPct: number): string {
  return `rotate(${(cumOffsetPct / 100) * 360})`
}
function arcPath(pct: number, radius: number): string {
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ
  return `stroke-dasharray="${dash} ${circ - dash}"`
}
</script>

<template>
  <div id="cs-home-demo" class="cs-sim" :class="{ 'cs-visible': visible }">
    <!-- ================= 标题栏 ================= -->
    <div class="cs-sim-titlebar">
      <div class="cs-sim-traffic">
        <span class="dot dot-r"></span>
        <span class="dot dot-y"></span>
        <span class="dot dot-g"></span>
      </div>
      <div class="cs-sim-title">ClassyShark — {{ DEMO.name }}</div>
      <div class="cs-sim-title-right">
        <span class="cs-sim-ver">v3.20</span>
        <button class="cs-sim-autoplay" :class="{ on: autoplay }" @click="toggleAuto">
          {{ autoplay ? '⏸ 暂停演示' : '▶ 自动演示' }}
        </button>
      </div>
    </div>

    <!-- ================= 工具栏：阶段切换（可点击） ================= -->
    <div class="cs-sim-toolbar">
      <button class="cs-sim-tab" :class="{ active: phase === 0 }" @click="go(0)">① 看不懂的黑盒</button>
      <button class="cs-sim-tab" :class="{ active: phase === 1 }" @click="go(1)">② 逐层拆开看</button>
      <button class="cs-sim-tab" :class="{ active: phase === 2 }" @click="go(2)">③ 体检报告</button>
      <span class="cs-sim-toolbar-note">← 点标签直接切换</span>
    </div>

    <!-- ================= 主体 ================= -->
    <div class="cs-sim-body">
      <!-- 左侧：功能树 -->
      <aside class="cs-sim-tree">
        <div class="cs-sim-tree-head">导航 <span v-if="phase < 2" class="cs-sim-tree-hint">{{ phase === 0 ? '等待分析…' : '拆包中…' }}</span></div>
        <ul class="cs-sim-tree-list">
          <li
            v-for="nd in TREE_NODES" :key="nd.id"
            class="cs-sim-node"
            :class="{ on: phase === 2 && sel === nd.id, off: phase !== 2 }"
            @click="pick(nd.id)">
            <span class="cs-sim-node-ic">{{ nd.ic }}</span>
            <span class="cs-sim-node-name">{{ nd.name }}</span>
            <span v-if="nd.danger" class="cs-sim-node-warn">⚠</span>
          </li>
        </ul>
        <div class="cs-sim-tree-foot">{{ formatNum(DEMO.totalClasses) }} 个类 · {{ formatNum(DEMO.totalMethods) }} 个方法</div>
      </aside>

      <!-- 右侧：内容区 -->
      <section class="cs-sim-content">
        <!-- 幕 1：看不懂 -->
        <transition name="fade">
          <div v-if="phase === 0" class="cs-act cs-act-problem">
            <div class="cs-question-big">手里一个 App，你根本不知道它里面装了什么</div>
            <div class="cs-problem-row">
              <div class="cs-apk-chip cs-float-in">
                <span class="cs-apk-icon">📦</span>
                <span class="cs-apk-name">{{ DEMO.name }}</span>
                <span class="cs-apk-size">{{ DEMO.size }}</span>
              </div>
              <div class="cs-arrow cs-pulse">⟶</div>
              <div class="cs-blackbox">
                <div class="cs-blackbox-title">黑盒</div>
                <div class="cs-question-marks"><span>?</span><span>?</span><span>?</span></div>
                <div class="cs-blackbox-hint">不可读 · 二进制 · 压缩</div>
              </div>
            </div>
            <div class="cs-problem-cards">
              <div class="cs-card-mini cs-count-up"><b>{{ formatNum(DEMO.totalClasses) }}</b><span>多少功能？</span></div>
              <div class="cs-card-mini cs-warn"><b>逼近上限</b><span>代码量太大了</span></div>
              <div class="cs-card-mini"><b>{{ DEMO.nativeLibCount }}+</b><span>用了谁的代码？</span></div>
            </div>
            <button class="cs-sim-start" @click="go(1)">▶ 开始分析</button>
          </div>
        </transition>

        <!-- 幕 2：帮你看懂 -->
        <transition name="fade">
          <div v-if="phase === 1" class="cs-act cs-act-solve">
            <div class="cs-solve-title">就像安检扫描 —— 逐层帮你把里面看透</div>
            <div class="cs-solve-pipeline">
              <div class="cs-pipe-step cs-pipe-1"><div class="cs-pipe-ic">📦</div><div class="cs-pipe-name">收下 App</div></div>
              <div class="cs-pipe-flow cs-flow-1"></div>
              <div class="cs-pipe-step cs-pipe-2"><div class="cs-pipe-ic">🔍</div><div class="cs-pipe-name">拆包扫描<small>把压缩包摊开</small></div></div>
              <div class="cs-pipe-flow cs-flow-2"></div>
              <div class="cs-pipe-step cs-pipe-3"><div class="cs-pipe-ic">🗂️</div><div class="cs-pipe-name">盘点代码<small>{{ formatNum(DEMO.totalClasses) }} 个功能</small></div></div>
              <div class="cs-pipe-flow cs-flow-3"></div>
              <div class="cs-pipe-step cs-pipe-4"><div class="cs-pipe-ic">📡</div><div class="cs-pipe-name">识别组件<small>{{ DEMO.nativeLibCount }} 家第三方</small></div></div>
              <div class="cs-pipe-flow cs-flow-4"></div>
              <div class="cs-pipe-step cs-pipe-5"><div class="cs-pipe-ic">⚠️</div><div class="cs-pipe-name">风险体检<small>{{ DEMO.manifestIssueCount }} 处隐患</small></div></div>
            </div>
            <div class="cs-solve-banner cs-fade-late"><span class="cs-spark">✨</span> 不用源码、不用懂技术 —— 放进去，几秒就出结果</div>
            <button class="cs-sim-start" @click="go(2)">生成体检报告 →</button>
          </div>
        </transition>

        <!-- 幕 3：看懂了 -->
        <transition name="fade">
          <div v-if="phase === 2" class="cs-act cs-act-result">
            <div class="cs-result-head">
              <div class="cs-result-title">体检报告：{{ DEMO.name }}</div>
              <div class="cs-result-sub">点击左侧功能树任意节点，看它还原出来的代码</div>
            </div>

            <div class="cs-result-grid">
              <!-- 方法数环形图 -->
              <div class="cs-result-panel cs-reveal-1">
                <div class="cs-panel-title">📊 代码量 · 已逼近容量红线</div>
                <div class="cs-donut-wrap">
                  <svg viewBox="0 0 200 200" class="cs-donut">
                    <circle class="cs-donut-bg" cx="100" cy="100" r="80" fill="none" stroke-width="22" />
                    <g v-for="(d, i) in DEMO.dexes" :key="d.name" :transform="segRotate(DEMO.dexes.slice(0, i).reduce((a, x) => a + x.pct, 0))">
                      <circle class="cs-donut-seg" :class="`cs-seg-${i}`" cx="100" cy="100" r="80" fill="none" stroke-width="22" :style="arcPath(d.pct, 80)" />
                    </g>
                  </svg>
                  <div class="cs-donut-center"><b>{{ formatNum(DEMO.totalMethods) }}</b><span>方法总数</span></div>
                </div>
                <div class="cs-legend">
                  <div v-for="(d, i) in DEMO.dexes" :key="'l' + d.name" class="cs-legend-item">
                    <span class="cs-legend-dot" :class="`cs-dot-${i}`"></span>
                    <span>{{ d.name }}</span>
                    <b :class="{ 'cs-danger': d.nearLimit }">{{ formatNum(d.methods) }}</b>
                  </div>
                  <div class="cs-limit-line">
                    <span class="cs-legend-dot cs-dot-limit"></span>
                    <span>Android 单包容量红线</span><b>65,536</b>
                  </div>
                </div>
              </div>

              <!-- 第三方组件 -->
              <div class="cs-result-panel cs-reveal-2">
                <div class="cs-panel-title">🧩 用到的第三方组件（{{ DEMO.nativeLibCount }} 家）</div>
                <div class="cs-lib-cloud">
                  <span v-for="lib in DEMO.nativeLibs" :key="lib" class="cs-lib-chip">{{ lib }}</span>
                </div>
                <div class="cs-native-verdict">认出腾讯、字节等厂商的成熟组件</div>
              </div>

              <!-- 安全隐患 -->
              <div class="cs-result-panel cs-reveal-3">
                <div class="cs-panel-title">🛡️ 安全隐患（{{ DEMO.manifestIssueCount }} 处）</div>
                <ul class="cs-risk-list">
                  <li v-for="issue in DEMO.manifestIssues" :key="issue"><span class="cs-risk-ic">🔔</span><span>{{ issue }}</span></li>
                </ul>
                <div class="cs-risk-note">这些功能可能在 App 后台悄悄被触发</div>
              </div>
            </div>

            <!-- 源码面板：随功能树点击变化 -->
            <div class="cs-source-panel cs-reveal-4">
              <div class="cs-panel-title">
                🪄 代码还原 —— <span class="cs-mono">{{ selNode.name }}</span>
                <span class="cs-node-type">{{ selNode.ic }} {{ selNode.type }}</span>
              </div>
              <p class="cs-node-desc">{{ selNode.desc }}</p>
              <pre class="cs-source"><code v-html="selNode.code"></code></pre>
            </div>
          </div>
        </transition>
      </section>
    </div>

    <!-- ================= 状态栏 ================= -->
    <div class="cs-sim-statusbar">
      <span class="cs-st-left">{{ STATUS[phase].l }}</span>
      <span class="cs-st-mid">{{ STATUS[phase].m }}</span>
      <span class="cs-st-right">{{ STATUS[phase].r }}</span>
    </div>
  </div>
</template>

<style scoped>
/* ============ 窗口外壳 ============ */
.cs-sim {
  --c-win: #0e1524;
  --c-win-2: #111a2e;
  --c-panel: #0b1220;
  --c-line: #26324d;
  --c-txt: #cdd7ec;
  --c-txt-dim: #7d8fb0;
  --c-blue: #2b5fff;
  --c-teal: #00c4b4;
  --c-red: #ff4d6a;
  --c-amber: #ffb020;
  --c-purple: #9d6bff;
  border-radius: 14px;
  border: 1px solid var(--c-line);
  background: var(--c-win);
  box-shadow: 0 24px 70px rgba(10, 14, 30, 0.5), 0 2px 8px rgba(10, 14, 30, 0.4);
  margin: 28px 0;
  overflow: hidden;
  opacity: 0.4;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.cs-sim.cs-visible { opacity: 1; transform: translateY(0); }

/* ============ 标题栏 ============ */
.cs-sim-titlebar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #1b2436, #121a2b);
  border-bottom: 1px solid var(--c-line);
}
.cs-sim-traffic { display: flex; gap: 7px; flex-shrink: 0; }
.cs-sim-traffic .dot { width: 12px; height: 12px; border-radius: 50%; }
.cs-sim-traffic .dot-r { background: #ff5f57; }
.cs-sim-traffic .dot-y { background: #febc2e; }
.cs-sim-traffic .dot-g { background: #28c840; }
.cs-sim-title {
  flex: 1; min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px; color: #8fa3c8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cs-sim-title-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cs-sim-ver { font-size: 10px; color: var(--c-txt-dim); font-family: ui-monospace, monospace; }
.cs-sim-autoplay {
  border: 1px solid var(--c-line); background: transparent; color: var(--c-txt-dim);
  border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer;
  transition: all 0.25s;
}
.cs-sim-autoplay:hover { border-color: var(--c-teal); color: var(--c-teal); }
.cs-sim-autoplay.on { border-color: var(--c-teal); color: var(--c-teal); background: rgba(0, 196, 180, 0.12); }

/* ============ 工具栏 ============ */
.cs-sim-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--c-win);
  border-bottom: 1px solid var(--c-line);
}
.cs-sim-tab {
  border: 1px solid transparent; background: transparent; color: var(--c-txt-dim);
  border-radius: 999px; padding: 5px 14px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.25s;
}
.cs-sim-tab:hover { color: var(--c-txt); border-color: var(--c-line); }
.cs-sim-tab.active {
  color: #fff; background: var(--c-blue); border-color: var(--c-blue);
  box-shadow: 0 0 16px rgba(43, 95, 255, 0.45);
}
.cs-sim-toolbar-note { margin-left: auto; font-size: 11px; color: var(--c-txt-dim); }

/* ============ 主体 ============ */
.cs-sim-body { display: flex; align-items: stretch; }

/* ---- 功能树 ---- */
.cs-sim-tree {
  width: 216px; flex-shrink: 0;
  background: var(--c-panel);
  border-right: 1px solid var(--c-line);
  display: flex; flex-direction: column;
  padding: 10px 0;
}
.cs-sim-tree-head {
  font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
  color: var(--c-txt-dim); padding: 4px 14px 8px;
  display: flex; justify-content: space-between;
}
.cs-sim-tree-hint { text-transform: none; letter-spacing: 0; color: var(--c-amber); }
.cs-sim-tree-list { list-style: none; margin: 0; padding: 0; }
.cs-sim-node {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px; cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px; color: var(--c-txt-dim);
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.cs-sim-node:hover { background: rgba(43, 95, 255, 0.08); color: var(--c-txt); }
.cs-sim-node.off { opacity: 0.45; cursor: default; pointer-events: none; }
.cs-sim-node.on {
  background: rgba(43, 95, 255, 0.18);
  border-left-color: var(--c-blue);
  color: #fff;
}
.cs-sim-node-ic { flex-shrink: 0; }
.cs-sim-node-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs-sim-node-warn { color: var(--c-amber); font-size: 10px; margin-left: auto; }
.cs-sim-tree-foot {
  margin-top: auto; padding: 10px 14px;
  font-size: 10px; color: var(--c-txt-dim);
  border-top: 1px solid var(--c-line);
  font-family: ui-monospace, monospace;
}

/* ---- 内容区 ---- */
.cs-sim-content {
  flex: 1; min-width: 0;
  background: var(--c-win-2);
  padding: 18px 20px;
  position: relative;
}

/* ============ 幕 1：看不懂 ============ */
.cs-act-problem { text-align: center; padding: 10px 0; }
.cs-question-big {
  font-size: 21px; font-weight: 700; margin-bottom: 18px;
  background: linear-gradient(120deg, var(--c-red), var(--c-amber));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cs-problem-row { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; }
.cs-apk-chip {
  display: inline-flex; align-items: center; gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px dashed var(--c-blue); border-radius: 12px; padding: 12px 16px;
  max-width: 320px; animation: floatIn 0.8s ease;
}
.cs-apk-icon { font-size: 26px; }
.cs-apk-name { font-weight: 600; font-size: 12px; font-family: ui-monospace, monospace; word-break: break-all; color: var(--c-txt); }
.cs-apk-size { font-size: 11px; color: var(--c-txt-dim); background: rgba(255, 255, 255, 0.05); border-radius: 6px; padding: 2px 8px; }
.cs-arrow { font-size: 26px; color: var(--c-blue); animation: pulseX 1s ease infinite; }
.cs-blackbox {
  background: linear-gradient(135deg, #14142a, #24243e);
  color: #ddd; border-radius: 12px; padding: 14px 22px; text-align: center;
  border: 1px solid #3a3a5c; min-width: 170px; animation: floatIn 1.1s ease;
}
.cs-blackbox-title { font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; color: #cfd3f0; }
.cs-question-marks { display: flex; gap: 10px; justify-content: center; font-size: 22px; font-weight: 800; color: var(--c-red); }
.cs-question-marks span { animation: blinkQ 1.4s infinite; }
.cs-question-marks span:nth-child(2) { animation-delay: 0.3s; }
.cs-question-marks span:nth-child(3) { animation-delay: 0.6s; }
.cs-blackbox-hint { font-size: 11px; opacity: 0.7; margin-top: 2px; }
.cs-problem-cards { display: flex; gap: 14px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
.cs-card-mini {
  background: rgba(255, 255, 255, 0.05); border: 1px solid var(--c-line);
  border-radius: 10px; padding: 8px 16px;
  display: flex; flex-direction: column; align-items: center; min-width: 110px;
  animation: floatUp 0.6s ease backwards;
}
.cs-card-mini b { font-size: 20px; color: var(--c-blue); }
.cs-card-mini span { font-size: 12px; color: var(--c-txt-dim); }
.cs-card-mini.cs-warn b { color: var(--c-red); }
.cs-card-mini.cs-count-up b { color: var(--c-purple); }
.cs-sim-start {
  margin-top: 22px;
  border: none; background: linear-gradient(90deg, var(--c-blue), #3f6bff);
  color: #fff; font-size: 14px; font-weight: 700;
  border-radius: 10px; padding: 11px 30px; cursor: pointer;
  box-shadow: 0 6px 22px rgba(43, 95, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.cs-sim-start:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(43, 95, 255, 0.55); }
.cs-sim-start:active { transform: translateY(0); }

/* ============ 幕 2：帮你看懂 ============ */
.cs-act-solve { padding: 10px 0; text-align: center; }
.cs-solve-title { text-align: center; font-size: 19px; font-weight: 700; margin-bottom: 22px; color: var(--c-teal); }
.cs-solve-pipeline { display: flex; align-items: stretch; justify-content: center; gap: 0; flex-wrap: wrap; }
.cs-pipe-step {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(43, 95, 255, 0.35);
  border-radius: 12px; padding: 12px 14px; min-width: 96px; text-align: center;
  animation: floatUp 0.5s ease backwards;
}
.cs-pipe-1 { animation-delay: 0s; } .cs-pipe-2 { animation-delay: 0.3s; }
.cs-pipe-3 { animation-delay: 0.6s; } .cs-pipe-4 { animation-delay: 0.9s; }
.cs-pipe-5 { animation-delay: 1.2s; }
.cs-pipe-ic { font-size: 24px; }
.cs-pipe-name { font-size: 12px; font-weight: 600; margin-top: 4px; line-height: 1.3; color: var(--c-txt); }
.cs-pipe-name small { font-size: 10px; color: var(--c-txt-dim); font-weight: 400; }
.cs-pipe-flow {
  width: 30px; height: 4px; align-self: center; border-radius: 2px;
  background: linear-gradient(90deg, var(--c-blue), var(--c-teal));
  position: relative; overflow: hidden;
}
.cs-pipe-flow::after {
  content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%;
  background: #fff; border-radius: 2px; animation: flowDash 1.2s linear infinite;
}
.cs-flow-1 { animation-delay: 0.2s; } .cs-flow-2 { animation-delay: 0.5s; }
.cs-flow-3 { animation-delay: 0.8s; } .cs-flow-4 { animation-delay: 1.1s; }
.cs-solve-banner { margin-top: 22px; font-weight: 600; color: var(--c-teal); animation: fadeLate 0.8s ease backwards; }
.cs-spark { animation: sparkle 1.2s ease infinite; display: inline-block; }

/* ============ 幕 3：看懂了 ============ */
.cs-act-result { padding: 4px 0; }
.cs-result-head { margin-bottom: 12px; }
.cs-result-title { font-size: 16px; font-weight: 700; color: var(--c-blue); }
.cs-result-sub { font-size: 11px; color: var(--c-txt-dim); margin-top: 2px; }
.cs-result-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.cs-result-panel, .cs-source-panel {
  background: rgba(255, 255, 255, 0.045); border: 1px solid var(--c-line);
  border-radius: 10px; padding: 12px 12px;
  animation: floatUp 0.5s ease backwards;
}
.cs-reveal-1 { animation-delay: 0s; } .cs-reveal-2 { animation-delay: 0.2s; }
.cs-reveal-3 { animation-delay: 0.4s; } .cs-reveal-4 { animation-delay: 0.6s; }
.cs-panel-title { font-size: 12px; font-weight: 700; margin-bottom: 10px; color: var(--c-txt); }

.cs-donut-wrap { position: relative; display: flex; align-items: center; gap: 12px; }
.cs-donut { width: 128px; height: 128px; flex-shrink: 0; }
.cs-donut-bg { stroke: rgba(150, 160, 200, 0.14); }
.cs-donut-seg { stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; }
.cs-seg-0 { stroke: var(--c-blue); } .cs-seg-1 { stroke: var(--c-teal); } .cs-seg-2 { stroke: var(--c-purple); }
.cs-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.cs-donut-center b { font-size: 17px; color: var(--c-blue); }
.cs-donut-center span { font-size: 10px; color: var(--c-txt-dim); }
.cs-legend { flex: 1; display: flex; flex-direction: column; gap: 5px; font-size: 10px; color: var(--c-txt-dim); }
.cs-legend-item, .cs-limit-line { display: flex; align-items: center; gap: 6px; }
.cs-legend-item b { margin-left: auto; }
.cs-limit-line { margin-top: 4px; border-top: 1px dashed rgba(255, 77, 106, 0.4); padding-top: 5px; }
.cs-legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.cs-dot-0 { background: var(--c-blue); } .cs-dot-1 { background: var(--c-teal); } .cs-dot-2 { background: var(--c-purple); }
.cs-dot-limit { background: var(--c-red); }
.cs-danger { color: var(--c-red); } .cs-limit-line b { color: var(--c-red); }

.cs-lib-cloud { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
.cs-lib-chip {
  font-size: 10px; font-family: ui-monospace, monospace;
  background: rgba(157, 107, 255, 0.15); color: #c9b8ff;
  border: 1px solid rgba(157, 107, 255, 0.4); border-radius: 6px; padding: 2px 6px;
}
.cs-native-verdict { font-size: 11px; color: var(--c-txt-dim); }

.cs-risk-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.cs-risk-list li {
  display: flex; align-items: center; gap: 6px; font-size: 10px;
  font-family: ui-monospace, monospace;
  background: rgba(255, 77, 106, 0.08); border-radius: 6px; padding: 4px 7px;
  color: var(--c-txt);
}
.cs-risk-ic { font-size: 10px; }
.cs-risk-note { font-size: 11px; color: var(--c-red); margin-top: 8px; font-weight: 600; }

.cs-source-panel { margin-top: 10px; }
.cs-mono { font-family: ui-monospace, monospace; }
.cs-node-type { float: right; font-size: 10px; color: var(--c-txt-dim); font-weight: 400; }
.cs-node-desc { font-size: 11px; color: var(--c-txt-dim); margin: 0 0 8px; line-height: 1.5; }
.cs-source {
  margin: 0; padding: 12px 14px; border-radius: 8px; overflow-x: auto;
  background: #0b0f1e; color: #d6d6f2; font-size: 11.5px; line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.tok-kw { color: #c792ea; }
.tok-cls { color: #82aaff; }
.tok-fn { color: #c3e88d; }
.tok-str { color: #ffcb6b; }
.tok-cmt { color: #63708f; font-style: italic; }

/* ============ 状态栏 ============ */
.cs-sim-statusbar {
  display: flex; align-items: center; gap: 16px;
  padding: 7px 14px;
  background: var(--c-panel);
  border-top: 1px solid var(--c-line);
  font-family: ui-monospace, monospace; font-size: 11px;
  color: var(--c-txt-dim);
}
.cs-st-left { color: var(--c-teal); font-weight: 700; }
.cs-st-mid { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs-st-right { color: var(--c-txt-dim); }

/* ============ 动画 ============ */
@keyframes floatIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes floatUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes blinkQ { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes pulseX { 0%, 100% { transform: translateX(0); opacity: 0.6; } 50% { transform: translateX(6px); opacity: 1; } }
@keyframes flowDash { to { left: 120%; } }
@keyframes fadeLate { from { opacity: 0; } to { opacity: 1; } }
@keyframes sparkle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.45s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 860px) {
  .cs-sim-tree { display: none; }
  .cs-result-grid { grid-template-columns: 1fr; }
}
</style>
