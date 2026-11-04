import 'vuetify/styles'
import '@/styles/vuetify-v3-compat.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

export default createVuetify(
  {
    components,
    theme: {
      // Vuetify 4부터 기본 테마가 'system'으로 변경됨 → 기존처럼 light 고정
      defaultTheme: 'light'
    },
    display: {
      // Vuetify 4에서 md/lg/xl/xxl 브레이크포인트가 줄어듦 → 기존 레이아웃 유지를 위해 v3 값으로 복원
      thresholds: {
        md: 960,
        lg: 1280,
        xl: 1920,
        xxl: 2560
      }
    }
  }
)
