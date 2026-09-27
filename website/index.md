---
layout: doc
sidebar: false
aside: false
outline: false
editLink: false
lastUpdated: false
---

<!-- ======================= 首屏 Hero ======================= -->
<section class="cs-home-hero">
  <div class="cs-hero-badge">🦈 开源 · 单 jar · Apache 2.0</div>
  <h1 class="cs-hero-title">
    你的 APK 是个黑盒，<br />
    <span class="cs-hero-grad">ClassyShark 帮你一眼看穿</span>
  </h1>
  <p class="cs-hero-sub">
    拖入任意 APK / DEX / JAR / SO —— 类结构、方法数、Native 库、Manifest 风险，
    秒级还原成你能读懂的答案。
  </p>
  <div class="cs-hero-actions">
    <a class="cs-btn cs-btn-brand" href="/guide/quick-start">🚀 立即上手</a>
    <a class="cs-btn cs-btn-alt" href="/cli/index">🛠️ 命令行模式</a>
  </div>
  <div class="cs-hero-stats">
    <div><b>24 MB</b><span>一个真实 APK</span></div>
    <div><b>&lt; 10 秒</b><span>完成全量分析</span></div>
    <div><b>1 个 jar</b><span>无需安装环境</span></div>
  </div>
</section>

<!-- ======================= 三幕演示动画 ======================= -->
<HomeHeroDemo />

<!-- ======================= 它解决什么问题 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">为什么你需要它</h2>
  <p class="cs-section-lead">APK 是压缩 + 二进制的混合体。没有工具时，你面对的是：</p>
  <div class="cs-pain-grid">
    <div class="cs-pain-card">
      <div class="cs-pain-ic">🔒</div>
      <h3>代码不可读</h3>
      <p>dex 是字节码，类、字段、方法全是二进制编码，肉眼无法阅读。</p>
    </div>
    <div class="cs-pain-card">
      <div class="cs-pain-ic">📏</div>
      <h3>体积不可知</h3>
      <p>方法数有没有逼近 65,536 上限？多 dex 怎么拆的？第三方库占了多少？</p>
    </div>
    <div class="cs-pain-card">
      <div class="cs-pain-ic">🕳️</div>
      <h3>风险看不见</h3>
      <p>哪些隐式广播能被外部触发？有没有私有 NDK 库？有没有服务端库误入客户端？</p>
    </div>
  </div>
</section>

<!-- ======================= 怎么解决 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">它怎么解决</h2>
  <div class="cs-how-steps">
    <div class="cs-how-step">
      <div class="cs-how-num">1</div>
      <div class="cs-how-body">
        <h3>解包与翻译</h3>
        <p>基于 dexlib2 / ASM / binutils 解析 dex、ELF、二进制 XML，把字节还原为结构。</p>
      </div>
    </div>
    <div class="cs-how-step">
      <div class="cs-how-num">2</div>
      <div class="cs-how-body">
        <h3>类树与源码</h3>
        <p>33,655 个类按包组织成树，任意类可查看字段、方法、依赖与重建源码。</p>
      </div>
    </div>
    <div class="cs-how-step">
      <div class="cs-how-num">3</div>
      <div class="cs-how-body">
        <h3>统计与告警</h3>
        <p>方法数环形图、Native 库清单、Manifest 风险项、依赖健康检查，一次性产出。</p>
      </div>
    </div>
  </div>
</section>

<!-- ======================= 解决得如何 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">解决得如何</h2>
  <div class="cs-proof-grid">
    <div class="cs-proof-card">
      <div class="cs-proof-value">33,655</div>
      <div class="cs-proof-label">类 · 全部枚举并分类</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value">179,131</div>
      <div class="cs-proof-label">方法 · 逐个计数归包</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value">42</div>
      <div class="cs-proof-label">Native 库 · 识别到库名</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value cs-proof-warn">8</div>
      <div class="cs-proof-label">Manifest 风险 · 定位到接收器</div>
    </div>
  </div>
  <p class="cs-proof-note">以上数字来自上方演示 —— 对一个真实上线的 24MB APK 的实际分析结果。</p>
</section>

<!-- ======================= 能力总览 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">你能拿到什么</h2>
  <div class="cs-cap-grid">
    <div class="cs-cap-card">
      <div class="cs-cap-ic">🖥️</div>
      <h3>GUI 桌面工具</h3>
      <p>拖拽即开，类树 + 源码 + 统计三区联动，深浅双主题。</p>
      <a href="/gui/index">了解更多 →</a>
    </div>
    <div class="cs-cap-card">
      <div class="cs-cap-ic">🛠️</div>
      <h3>CLI 命令</h3>
      <p><code>-inspect</code> <code>-methodcounts</code> <code>-export</code>，直接进 CI。</p>
      <a href="/cli/index">了解更多 →</a>
    </div>
    <div class="cs-cap-card">
      <div class="cs-cap-ic">📚</div>
      <h3>Agent API</h3>
      <p>JSON-over-stdio，把分析能力嵌入自己的工具链。</p>
      <a href="/api/index">了解更多 →</a>
    </div>
  </div>
</section>
