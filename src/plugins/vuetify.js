import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

// 색 값은 src/styles/base/tokens.css 와 같게 유지한다
const fresh = {
  dark: false,
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    'on-surface': '#222222',
    'on-background': '#222222',
    primary: '#13865F',
    secondary: '#2DBE8C',
    success: '#13865F',
    warning: '#F5B400',
    'on-warning': '#3D2D00',
    error: '#D93A3F',
    info: '#3B82C4',
    cta: '#FF7A2F',
    'on-cta': '#2A1200'
  }
}

export default createVuetify(
  {
    components,
    theme: {
      // Vuetify 4부터 기본 테마가 'system'으로 변경됨 → 라이트 테마로 고정
      defaultTheme: 'fresh',
      themes: { fresh }
    },
    defaults: {
      VBtn: { rounded: 'lg' },
      VCard: { rounded: 'lg' },
      VTextField: { rounded: 'lg' },
      VSelect: { rounded: 'lg' },
      VChip: { rounded: 'lg' }
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
