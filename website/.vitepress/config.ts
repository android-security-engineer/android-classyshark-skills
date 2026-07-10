import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ClassyShark',
  description: 'Android 二进制检查工具 — 浏览任意 Android 可执行文件',
  lang: 'zh-CN',
  base: '/android-classyshark-skills/',
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname: 'https://android-security-engineer.github.io/android-classyshark-skills/'
  },
  head: [
    ['link', { rel: 'icon', href: '/android-classyshark-skills/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#2b5fff' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ClassyShark 🦈',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/android-security-engineer/android-classyshark-skills' }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    nav: [
      { text: '🦈 指南', link: '/guide/what-is-classyshark' },
      { text: '🛠️ CLI', link: '/cli/index' },
      { text: '🖥️ GUI', link: '/gui/index' },
      { text: '📚 API', link: '/api/index' },
      { text: '🧩 模块', link: '/reference/modules/Main' },
      { text: '🚀 部署', link: '/deployment/github-pages' }
    ],
    sidebar: {
      '/guide/': [],
      '/tutorials/': [],
      '/cli/': [],
      '/gui/': [],
      '/api/': [],
      '/reference/': [],
      '/deployment/': [],
      '/contributing/': []
    },
    footer: {
      message: '基于 Apache 2.0 协议发布',
      copyright: 'Copyright © 2020 Google, Inc.'
    }
  }
})
