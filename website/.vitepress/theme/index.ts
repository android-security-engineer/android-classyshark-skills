import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeHeroDemo from './components/HomeHeroDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeHeroDemo', HomeHeroDemo)
  }
} satisfies Theme
