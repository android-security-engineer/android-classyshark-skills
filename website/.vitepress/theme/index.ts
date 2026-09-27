import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ClassySharkSim from './components/ClassySharkSim.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ClassySharkSim', ClassySharkSim)
  }
} satisfies Theme
