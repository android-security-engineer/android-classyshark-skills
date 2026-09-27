<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ---- 真实演示数据（来自 com.apkpure.aegon-3.20.7803.apk 的实际分析）----
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
  manifestIssueCount: 8,
  nativeErrors: ['libBugly_dumper.so missing SONAME'],
  sourceSnippet: `package com.tencent.mmkv;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Parcelable;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

public class MMKV implements SharedPreferences {
  private static MMKVHandler gCallbackHandler;
  private static MMKVLogLevel[] index2LogLevel;
  private long handle;

  public static MMKV defaultMMKV() {
    return getRootDir() != null
        ? mmkvWithID(DEFAULT_MMAP_ID)
        : null;
  }

  public boolean putString(String key, String value) {
    return encodeString(key, value);
  }

  private native boolean encodeString(String key, String value);
  private native String decodeString(String key);
}`
}

// ---- 播放控制 ----
const phase = ref(0)          // 0=问题  1=解决  2=结果
const started = ref(false)
const visible = ref(false)
const playCount = ref(0)
let observer: IntersectionObserver | null = null
let phaseTimer: ReturnType<typeof setInterval> | null = null

// 结果页数据滚动
const resultReveal = ref(0)

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    const e = entries[0]
    if (e.isIntersecting) {
      visible.value = true
      if (!started.value) {
        started.value = true
        startLoop()
      }
    } else {
      visible.value = false
    }
  }, { threshold: 0.35 })
  const el = document.getElementById('cs-home-demo')
  if (el) observer.observe(el)
})

function startLoop() {
  phaseTimer = setInterval(() => {
    if (!visible.value) return
    // 每 1.2s 推进一个 step；结果阶段内部还有 reveal 进度
    if (phase.value === 2) {
      if (resultReveal.value < 100) {
        resultReveal.value += 8
        return
      }
      // 结果展示完成后，短暂停留后回到幕1
      playCount.value++
      phase.value = 0
      resultReveal.value = 0
    } else {
      phase.value++
      if (phase.value === 2) {
        // 进入结果阶段，从头开始 reveal
        resultReveal.value = 0
      }
    }
  }, 1200)
}

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (phaseTimer) clearInterval(phaseTimer)
})

// 环形图：每个 dex 的弧。offsetPct 是前一段累计占比（0~100）
function arcPath(pct: number, radius: number, offsetPct: number): string {
  const r = radius
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  // 用 SVG 周长按比例偏移：stroke-dashoffset 正值=逆时针回退
  const offset = (offsetPct / 100) * circ
  // 用旋转而非 dashoffset 表达起止（更直观）：每段本身从 0 开始，旋转整段定位
  return `stroke-dasharray="${dash} ${circ - dash}"`
}
// 环形图渲染：直接用 rotate 定位每段起角
function segRotate(cumOffsetPct: number): string {
  return `rotate(${cumOffsetPct / 100 * 360})`
}

// 计数滚动效果
function formatNum(n: number): string {
  return n.toLocaleString('en-US')
}

const libsShown = ref(12)
</script>

<template>
  <div id="cs-home-demo" class="cs-demo" :class="{ 'cs-visible': visible }">
    <div class="cs-demo-header">
      <div class="cs-demo-tabs">
        <span class="cs-tab" :class="{ active: phase === 0 }">① 看不懂</span>
        <span class="cs-tab" :class="{ active: phase === 1 }">② 帮你看懂</span>
        <span class="cs-tab" :class="{ active: phase === 2 }">③ 看懂了</span>
      </div>
      <span class="cs-demo-label">⬆ 上面就是一个真实的 24MB App 装进 ClassyShark 后的分析过程</span>
    </div>

    <div class="cs-stage">
      <!-- ================= 幕 1：问题 ================= -->
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
              <div class="cs-question-marks">
                <span>?</span><span>?</span><span>?</span>
              </div>
              <div class="cs-blackbox-hint">不可读 · 二进制 · 压缩</div>
            </div>
          </div>
          <div class="cs-problem-cards">
            <div class="cs-card-mini cs-count-up">
              <b>{{ formatNum(DEMO.totalClasses) }}</b>
              <span>多少功能？</span>
            </div>
            <div class="cs-card-mini cs-warn">
              <b>逼近上限</b>
              <span>代码量太大了</span>
            </div>
            <div class="cs-card-mini">
              <b>{{ DEMO.nativeLibCount }}+</b>
              <span>用了谁的代码？</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- ================= 幕 2：解决 ================= -->
      <transition name="fade">
        <div v-if="phase === 1" class="cs-act cs-act-solve">
          <div class="cs-solve-title">就像安检扫描 —— 逐层帮你把里面看透</div>
          <div class="cs-solve-pipeline">
            <div class="cs-pipe-step cs-pipe-1">
              <div class="cs-pipe-ic">📦</div>
              <div class="cs-pipe-name">收下 App</div>
            </div>
            <div class="cs-pipe-flow cs-flow-1"></div>
            <div class="cs-pipe-step cs-pipe-2">
              <div class="cs-pipe-ic">🔍</div>
              <div class="cs-pipe-name">拆包扫描<br/><small>把压缩包摊开</small></div>
            </div>
            <div class="cs-pipe-flow cs-flow-2"></div>
            <div class="cs-pipe-step cs-pipe-3">
              <div class="cs-pipe-ic">🗂️</div>
              <div class="cs-pipe-name">盘点代码<br/><small>{{ formatNum(DEMO.totalClasses) }} 个功能</small></div>
            </div>
            <div class="cs-pipe-flow cs-flow-3"></div>
            <div class="cs-pipe-step cs-pipe-4">
              <div class="cs-pipe-ic">📡</div>
              <div class="cs-pipe-name">识别组件<br/><small>{{ DEMO.nativeLibCount }} 家第三方</small></div>
            </div>
            <div class="cs-pipe-flow cs-flow-4"></div>
            <div class="cs-pipe-step cs-pipe-5">
              <div class="cs-pipe-ic">⚠️</div>
              <div class="cs-pipe-name">风险体检<br/><small>{{ DEMO.manifestIssueCount }} 处隐患</small></div>
            </div>
          </div>
          <div class="cs-solve-banner cs-fade-late">
            <span class="cs-spark">✨</span> 不用源码、不用懂技术 —— 放进去，几秒就出结果
          </div>
        </div>
      </transition>

      <!-- ================= 幕 3：结果 ================= -->
      <transition name="fade">
        <div v-if="phase === 2" class="cs-act cs-act-result">
          <div class="cs-result-head">
            <div class="cs-result-title">体检报告：{{ DEMO.name }}</div>
          </div>

          <div class="cs-result-grid">
            <!-- 左侧：方法数环形图 -->
            <div class="cs-result-panel cs-reveal-1">
              <div class="cs-panel-title">📊 代码量 · 已逼近容量红线</div>
              <div class="cs-donut-wrap">
            <svg viewBox="0 0 200 200" class="cs-donut">
              <circle class="cs-donut-bg" cx="100" cy="100" r="80" fill="none" stroke-width="22" />
              <g v-for="(d, i) in DEMO.dexes" :key="d.name" :transform="segRotate(DEMO.dexes.slice(0, i).reduce((a, x) => a + x.pct, 0))">
                <circle
                  class="cs-donut-seg" :class="`cs-seg-${i}`"
                  cx="100" cy="100" r="80" fill="none" stroke-width="22"
                  :style="arcPath(d.pct, 80, 0)" />
              </g>
            </svg>
                <div class="cs-donut-center">
                  <b>{{ formatNum(DEMO.totalMethods) }}</b>
                  <span>方法总数</span>
                </div>
              </div>
                <div class="cs-legend">
                <div v-for="(d, i) in DEMO.dexes" :key="'l'+d.name" class="cs-legend-item">
                  <span class="cs-legend-dot" :class="`cs-dot-${i}`"></span>
                  <span>{{ d.name }}</span>
                  <b :class="{ 'cs-danger': d.nearLimit }">{{ formatNum(d.methods) }}</b>
                </div>
                <div class="cs-limit-line">
                  <span class="cs-legend-dot cs-dot-limit"></span>
                  <span>Android 单包容量红线</span>
                  <b>65,536</b>
                </div>
              </div>
            </div>

            <!-- 中间：Native 库 -->
            <div class="cs-result-panel cs-reveal-2">
              <div class="cs-panel-title">🧩 用到的第三方组件（{{ DEMO.nativeLibCount }} 家）</div>
              <div class="cs-lib-cloud">
                <span v-for="lib in DEMO.nativeLibs.slice(0, libsShown)" :key="lib" class="cs-lib-chip">
                  {{ lib }}
                </span>
                <span v-if="DEMO.nativeLibCount > libsShown" class="cs-lib-more">+{{ DEMO.nativeLibCount - libsShown }} 更多…</span>
              </div>
              <div class="cs-native-err" v-if="DEMO.nativeErrors.length">
                <span class="cs-warn-ic">⚠️</span>
                <span>{{ DEMO.nativeErrors[0] }}</span>
              </div>
              <div class="cs-native-verdict">认出腾讯、字节等厂商的成熟组件</div>
            </div>

            <!-- 右侧：Manifest 风险 -->
            <div class="cs-result-panel cs-reveal-3">
              <div class="cs-panel-title">🛡️ 安全隐患（{{ DEMO.manifestIssueCount }} 处）</div>
              <ul class="cs-risk-list">
                <li v-for="issue in DEMO.manifestIssues" :key="issue">
                  <span class="cs-risk-ic">🔔</span>
                  <span>{{ issue }}</span>
                </li>
              </ul>
              <div class="cs-risk-note">这些功能可能在 App 后台悄悄被触发</div>
            </div>
          </div>

          <!-- 底部：源码反编译 -->
          <div class="cs-source-panel cs-reveal-4">
            <div class="cs-panel-title">🪄 甚至能把代码还原给你看 —— <span class="cs-mono">com.tencent.mmkv.MMKV</span></div>
            <pre class="cs-source"><code><span class="tok-kw">package</span> com.tencent.mmkv;
<span class="tok-kw">import</span> android.content.Context;
<span class="tok-kw">import</span> android.content.SharedPreferences;
<span class="tok-kw">import</span> android.os.Parcelable;
<span class="tok-kw">import</span> java.util.EnumMap;
<span class="tok-kw">import</span> java.util.HashMap;
<span class="tok-kw">import</span> java.util.Map;

<span class="tok-kw">public</span> <span class="tok-kw">class</span> <span class="tok-cls">MMKV</span> <span class="tok-kw">implements</span> <span class="tok-cls">SharedPreferences</span> {
  <span class="tok-kw">private</span> <span class="tok-kw">static</span> MMKVHandler gCallbackHandler;
  <span class="tok-kw">private</span> <span class="tok-kw">static</span> MMKVLogLevel[] index2LogLevel;
  <span class="tok-kw">private</span> <span class="tok-kw">long</span> handle;

  <span class="tok-kw">public</span> <span class="tok-kw">static</span> <span class="tok-cls">MMKV</span> <span class="tok-fn">defaultMMKV</span>() {
    <span class="tok-kw">return</span> getRootDir() != <span class="tok-kw">null</span>
        ? mmkvWithID(DEFAULT_MMAP_ID) : <span class="tok-kw">null</span>;
  }

  <span class="tok-kw">public</span> <span class="tok-kw">boolean</span> <span class="tok-fn">putString</span>(String key, String value) {
    <span class="tok-kw">return</span> <span class="tok-fn">encodeString</span>(key, value);
  }

  <span class="tok-kw">private</span> <span class="tok-kw">native</span> <span class="tok-kw">boolean</span> <span class="tok-fn">encodeString</span>(String key, String value);
  <span class="tok-kw">private</span> <span class="tok-kw">native</span> String <span class="tok-fn">decodeString</span>(String key);
}</code></pre>
          </div>
        </div>
      </transition>
    </div>

    <div class="cs-demo-progress">
      <span class="cs-prog" :class="{ on: phase >= 0 }"></span>
      <span class="cs-prog" :class="{ on: phase >= 1 }"></span>
      <span class="cs-prog" :class="{ on: phase >= 2 }"></span>
      <span class="cs-play-count" v-if="playCount > 0">已循环 {{ playCount }} 次 · 数据为真实分析结果</span>
    </div>
  </div>
</template>

<style scoped>
.cs-demo {
  --cs-blue: #2b5fff;
  --cs-teal: #00c4b4;
  --cs-red: #ff4d6a;
  --cs-amber: #ffb020;
  --cs-purple: #9d6bff;
  border-radius: 16px;
  border: 1px solid rgba(43, 95, 255, 0.2);
  background: linear-gradient(160deg, rgba(43,95,255,0.06), rgba(0,196,180,0.05));
  padding: 18px 20px 12px;
  margin: 24px 0;
  position: relative;
  overflow: hidden;
  opacity: 0.4;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.cs-demo.cs-visible { opacity: 1; transform: translateY(0); }

.cs-demo-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
}
.cs-demo-tabs { display: flex; gap: 6px; }
.cs-tab {
  font-size: 12px; font-weight: 600; color: var(--vp-c-text-2);
  border: 1px solid transparent; border-radius: 999px; padding: 3px 12px;
  transition: all 0.3s;
}
.cs-tab.active {
  color: #fff; background: var(--cs-blue);
  box-shadow: 0 0 14px rgba(43,95,255,0.5);
}
.cs-demo-label {
  font-size: 12px; color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.cs-stage { min-height: 360px; position: relative; }
.cs-act { width: 100%; }

/* ---------- 幕 1：问题 ---------- */
.cs-act-problem { text-align: center; padding: 16px 0 8px; }
.cs-question-big {
  font-size: 22px; font-weight: 700; margin-bottom: 18px;
  background: linear-gradient(120deg, var(--cs-red), var(--cs-amber));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cs-problem-row { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; }
.cs-apk-chip {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--vp-c-bg-soft); border: 2px dashed var(--cs-blue);
  border-radius: 12px; padding: 12px 16px; max-width: 340px;
  animation: floatIn 0.8s ease;
}
.cs-apk-icon { font-size: 26px; }
.cs-apk-name { font-weight: 600; font-size: 13px; font-family: var(--vp-font-family-mono); word-break: break-all; }
.cs-apk-size { font-size: 12px; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); border-radius: 6px; padding: 2px 8px; }
.cs-arrow { font-size: 26px; color: var(--cs-blue); animation: pulseX 1s ease infinite; }
.cs-blackbox {
  background: linear-gradient(135deg, #1a1a2e, #2d2d44); color: #ddd;
  border-radius: 12px; padding: 14px 22px; text-align: center;
  border: 1px solid #444; min-width: 170px;
  animation: floatIn 1.1s ease;
}
.cs-blackbox-title { font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; }
.cs-question-marks { display: flex; gap: 10px; justify-content: center; font-size: 22px; font-weight: 800; color: var(--cs-red); }
.cs-question-marks span { animation: blinkQ 1.4s infinite; }
.cs-question-marks span:nth-child(2) { animation-delay: 0.3s; }
.cs-question-marks span:nth-child(3) { animation-delay: 0.6s; }
.cs-blackbox-hint { font-size: 11px; opacity: 0.7; margin-top: 2px; }
.cs-problem-cards { display: flex; gap: 14px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
.cs-card-mini {
  background: var(--vp-c-bg-soft); border-radius: 10px; padding: 8px 16px;
  display: flex; flex-direction: column; align-items: center; min-width: 110px;
  animation: floatUp 0.6s ease backwards;
}
.cs-card-mini b { font-size: 20px; color: var(--cs-blue); }
.cs-card-mini span { font-size: 12px; color: var(--vp-c-text-2); }
.cs-card-mini.cs-warn b { color: var(--cs-red); }
.cs-card-mini.cs-count-up b { color: var(--cs-purple); }

/* ---------- 幕 2：解决 ---------- */
.cs-act-solve { padding: 10px 0; }
.cs-solve-title {
  text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 20px;
  color: var(--cs-teal);
}
.cs-solve-pipeline { display: flex; align-items: stretch; justify-content: center; gap: 0; flex-wrap: wrap; }
.cs-pipe-step {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--vp-c-bg-soft); border: 1px solid rgba(43,95,255,0.25);
  border-radius: 12px; padding: 12px 14px; min-width: 100px; text-align: center;
  animation: floatUp 0.5s ease backwards;
}
.cs-pipe-1 { animation-delay: 0s; }
.cs-pipe-2 { animation-delay: 0.3s; }
.cs-pipe-3 { animation-delay: 0.6s; }
.cs-pipe-4 { animation-delay: 0.9s; }
.cs-pipe-5 { animation-delay: 1.2s; }
.cs-pipe-ic { font-size: 24px; }
.cs-pipe-name { font-size: 12px; font-weight: 600; margin-top: 4px; line-height: 1.3; }
.cs-pipe-name small { font-size: 10px; color: var(--vp-c-text-3); font-weight: 400; }
.cs-pipe-flow {
  width: 34px; height: 4px; align-self: center; border-radius: 2px;
  background: linear-gradient(90deg, var(--cs-blue), var(--cs-teal));
  position: relative; overflow: hidden;
}
.cs-pipe-flow::after {
  content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%;
  background: #fff; border-radius: 2px;
  animation: flowDash 1.2s linear infinite;
}
.cs-flow-1 { animation-delay: 0.2s; } .cs-flow-2 { animation-delay: 0.5s; }
.cs-flow-3 { animation-delay: 0.8s; } .cs-flow-4 { animation-delay: 1.1s; }
.cs-solve-banner {
  margin-top: 22px; text-align: center; font-weight: 600; color: var(--cs-teal);
  animation: fadeLate 0.8s ease backwards;
}
.cs-spark { animation: sparkle 1.2s ease infinite; display: inline-block; }

/* ---------- 幕 3：结果 ---------- */
.cs-act-result { padding: 6px 0; }
.cs-result-head { margin-bottom: 12px; }
.cs-result-title { font-size: 17px; font-weight: 700; color: var(--cs-blue); }
.cs-result-grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 12px; }
.cs-result-panel, .cs-source-panel {
  background: var(--vp-c-bg-soft); border: 1px solid rgba(43,95,255,0.16);
  border-radius: 12px; padding: 12px 14px;
  animation: floatUp 0.5s ease backwards;
}
.cs-reveal-1 { animation-delay: 0s; }
.cs-reveal-2 { animation-delay: 0.25s; }
.cs-reveal-3 { animation-delay: 0.5s; }
.cs-reveal-4 { animation-delay: 0.75s; }
.cs-panel-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }

.cs-donut-wrap { display: flex; align-items: center; gap: 14px; }
.cs-donut { width: 150px; height: 150px; flex-shrink: 0; }
.cs-donut-bg { stroke: rgba(120,120,120,0.15); }
.cs-donut-seg { stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; transition: stroke-dasharray 1.2s ease; }
.cs-seg-0 { stroke: var(--cs-blue); }
.cs-seg-1 { stroke: var(--cs-teal); }
.cs-seg-2 { stroke: var(--cs-purple); }
.cs-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
.cs-donut-wrap { position: relative; }
.cs-donut-center b { font-size: 18px; color: var(--cs-blue); }
.cs-donut-center span { font-size: 11px; color: var(--vp-c-text-2); }
.cs-legend { flex: 1; display: flex; flex-direction: column; gap: 5px; font-size: 11px; }
.cs-legend-item, .cs-limit-line { display: flex; align-items: center; gap: 6px; }
.cs-legend-item b { margin-left: auto; }
.cs-limit-line { margin-top: 4px; border-top: 1px dashed rgba(255,77,106,0.4); padding-top: 5px; }
.cs-legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.cs-dot-0 { background: var(--cs-blue); }
.cs-dot-1 { background: var(--cs-teal); }
.cs-dot-2 { background: var(--cs-purple); }
.cs-dot-limit { background: var(--cs-red); }
.cs-danger { color: var(--cs-red); }
.cs-limit-line b { color: var(--cs-red); }

.cs-lib-cloud { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
.cs-lib-chip {
  font-size: 10px; font-family: var(--vp-font-family-mono);
  background: rgba(157,107,255,0.12); color: var(--cs-purple);
  border: 1px solid rgba(157,107,255,0.3); border-radius: 6px; padding: 2px 6px;
}
.cs-lib-more { font-size: 10px; color: var(--vp-c-text-3); align-self: center; }
.cs-native-err {
  display: flex; align-items: center; gap: 6px; font-size: 11px;
  color: var(--cs-amber); background: rgba(255,176,32,0.1);
  border-radius: 6px; padding: 4px 8px; margin-bottom: 8px;
}
.cs-native-verdict { font-size: 11px; color: var(--vp-c-text-2); }

.cs-risk-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.cs-risk-list li {
  display: flex; align-items: center; gap: 6px; font-size: 11px;
  font-family: var(--vp-font-family-mono);
  background: rgba(255,77,106,0.06); border-radius: 6px; padding: 4px 8px;
  color: var(--vp-c-text-1);
}
.cs-risk-ic { font-size: 11px; }
.cs-risk-note { font-size: 11px; color: var(--cs-red); margin-top: 8px; font-weight: 600; }

.cs-source-panel { margin-top: 12px; }
.cs-mono { font-family: var(--vp-font-family-mono); }
.cs-source {
  margin: 0; padding: 12px 14px; border-radius: 8px; overflow-x: auto;
  background: #14142a; color: #d6d6f2; font-size: 11.5px; line-height: 1.55;
}
.tok-kw { color: #c792ea; }
.tok-cls { color: #82aaff; }
.tok-fn { color: #c3e88d; }

/* ---------- 进度条 ---------- */
.cs-demo-progress { display: flex; align-items: center; gap: 6px; margin-top: 14px; }
.cs-prog { width: 60px; height: 4px; border-radius: 2px; background: rgba(120,120,120,0.2); transition: background 0.4s, box-shadow 0.4s; }
.cs-prog.on { background: linear-gradient(90deg, var(--cs-blue), var(--cs-teal)); box-shadow: 0 0 8px rgba(43,95,255,0.5); }
.cs-play-count { font-size: 11px; color: var(--vp-c-text-3); margin-left: auto; }

/* ---------- 动画 keyframes ---------- */
@keyframes floatIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes floatUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes blinkQ { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes pulseX { 0%, 100% { transform: translateX(0); opacity: 0.6; } 50% { transform: translateX(6px); opacity: 1; } }
@keyframes flowDash { to { left: 120%; } }
@keyframes fadeLate { from { opacity: 0; } to { opacity: 1; } }
@keyframes sparkle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .cs-result-grid { grid-template-columns: 1fr; }
  .cs-stage { min-height: 460px; }
}
</style>
