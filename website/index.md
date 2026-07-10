---
layout: home

hero:
  name: ClassyShark
  text: Android 二进制检查工具
  tagline: 浏览任意 Android 可执行文件，查看类接口、方法数、依赖与 Manifest
  image:
    src: /logo.svg
    alt: ClassyShark
  actions:
    - theme: brand
      text: 🚀 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 📖 了解工具
      link: /guide/what-is-classyshark

features:
  - icon: 📦
    title: 多格式支持
    details: APK / DEX / JAR / AAR / SO / CLASS，以及所有 Android 二进制 XML（Manifest、布局、资源）。
  - icon: 📊
    title: 方法数分析
    details: 按包聚合统计方法数，环形图可视化，定位 65k 限制与体积来源。
  - icon: 🔍
    title: 依赖检查
    details: 检测重复图像/HTTP/JSON 库、私有 NDK 库、不安全后台广播。
  - icon: 🛠️
    title: CLI 友好
    details: -export / -inspect / -methodcounts 命令，适合 CI/CD 集成。
  - icon: 🖥️
    title: GUI 浏览
    details: Swing 图形界面，类树导航、源码存根、深色/浅色主题。
  - icon: 📚
    title: 编程 API
    details: Shark facade 可作为库嵌入构建工具链。
---
