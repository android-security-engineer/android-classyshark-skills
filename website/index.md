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
  <div class="cs-hero-badge">🦈 开源 · 免费 · 一个文件搞定</div>
  <h1 class="cs-hero-title">
    想知道一个 App 里面装了什么？<br />
    <span class="cs-hero-grad">拖进去，几秒就有答案</span>
  </h1>
  <p class="cs-hero-sub">
    不用源码，不用懂技术。把任何一个 App 安装包交给 ClassyShark，
    它会把里面有多少功能、用了谁的代码、有没有安全隐患，<b>一件一件列给你看</b>。
  </p>
  <div class="cs-hero-actions">
    <a class="cs-btn cs-btn-brand" href="/guide/quick-start">🚀 现在就试</a>
    <a class="cs-btn cs-btn-alt" href="/cli/index">看看它怎么用</a>
  </div>
  <div class="cs-hero-stats">
    <div><b>1 个文件</b><span>不用安装任何环境</span></div>
    <div><b>几秒钟</b><span>出完整分析报告</span></div>
    <div><b>全免费</b><span>开源 · 可商用</span></div>
  </div>
</section>

<!-- ======================= 三幕演示动画 ======================= -->
<HomeHeroDemo />

<!-- ======================= 它解决什么问题 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">什么时候你会需要它</h2>
  <p class="cs-section-lead">下面这些事，光靠"看安装包"是永远做不到的 ——</p>
  <div class="cs-pain-grid">
    <div class="cs-pain-card">
      <div class="cs-pain-ic">🔍</div>
      <h3>你想知道对方 App 的底细</h3>
      <p>对手的产品、想接入的 SDK、怀疑有风险的 App —— 想知道它真实的结构和依赖，不用破解，ClassyShark 直接摊开给你看。</p>
    </div>
    <div class="cs-pain-card">
      <div class="cs-pain-ic">🚨</div>
      <h3>你想在发布前自查隐患</h3>
      <p>自己团队的 App 上线前，有没有超容量红线？有没有带进去不该带的东西？有没有容易被外部触发的功能？像体检一样过一遍。</p>
    </div>
    <div class="cs-pain-card">
      <div class="cs-pain-ic">🧩</div>
      <h3>你要给领导 / 客户一个交代</h3>
      <p>"这个包到底大在哪""三方 SDK 都有哪些""安全评估怎么做的" —— 一张清晰的报告，胜过千言万语。</p>
    </div>
  </div>
</section>

<!-- ======================= 怎么解决 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">怎么做到的？</h2>
  <div class="cs-how-steps">
    <div class="cs-how-step">
      <div class="cs-how-num">1</div>
      <div class="cs-how-body">
        <h3>把安装包拆开</h3>
        <p>APK 本质是个压缩包，ClassyShark 用业界成熟的解析引擎把它逐层摊开，任何 App 都能读。</p>
      </div>
    </div>
    <div class="cs-how-step">
      <div class="cs-how-num">2</div>
      <div class="cs-how-body">
        <h3>把代码翻成人话</h3>
        <p>里面所有功能模块（类）按目录排成树，每个模块有哪些方法、依赖什么，甚至能把代码还原出来给你读。</p>
      </div>
    </div>
    <div class="cs-how-step">
      <div class="cs-how-num">3</div>
      <div class="cs-how-body">
        <h3>自动体检 + 出报告</h3>
        <p>代码量、第三方组件、安全隐患、依赖健康 —— 一次性扫完，结果一目了然。</p>
      </div>
    </div>
  </div>
</section>

<!-- ======================= 解决得如何 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">它到底管不管用？</h2>
  <p class="cs-section-lead">下面是对一个真实上线 App 的分析结果 —— 不是演示数据，是真实跑出来的。</p>
  <div class="cs-proof-grid">
    <div class="cs-proof-card">
      <div class="cs-proof-value">33,655</div>
      <div class="cs-proof-label">个功能模块 · 全部识别并分类</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value">179,131</div>
      <div class="cs-proof-label">处代码逻辑 · 逐项盘点</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value">42</div>
      <div class="cs-proof-label">家第三方组件 · 认出是谁</div>
    </div>
    <div class="cs-proof-card">
      <div class="cs-proof-value cs-proof-warn">8</div>
      <div class="cs-proof-label">处安全隐患 · 定位到具体功能</div>
    </div>
  </div>
  <p class="cs-proof-note">样本：一个 24MB 的真实商业 App（com.apkpure.aegon）。ClassyShark 几秒就把它看完了 —— 数据真实，随时可以自己验证。</p>
</section>

<!-- ======================= 能力总览 ======================= -->
<section class="cs-section">
  <h2 class="cs-section-title">在哪儿能用它</h2>
  <div class="cs-cap-grid">
    <div class="cs-cap-card">
      <div class="cs-cap-ic">🖥️</div>
      <h3>桌面版 · 拖进去就看</h3>
      <p>适合平时查看，一个窗口看全部：功能树、代码、报告三区联动。</p>
      <a href="/gui/index">了解桌面版 →</a>
    </div>
    <div class="cs-cap-card">
      <div class="cs-cap-ic">🛠️</div>
      <h3>命令行 · 适合自动检查</h3>
      <p>一行命令跑分析，能接进发布流程，每次发版自动体检。</p>
      <a href="/cli/index">了解命令行 →</a>
    </div>
    <div class="cs-cap-card">
      <div class="cs-cap-ic">📚</div>
      <h3>开发者 · 把能力嵌进你的产品</h3>
      <p>标准 JSON 接口，几行代码就能把"看 App 底细"做成你自己的功能。</p>
      <a href="/api/index">了解接口 →</a>
    </div>
  </div>
</section>
