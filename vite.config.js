import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    // sockjs-client는 Node의 `global`을 참조하므로 브라우저의 globalThis로 대체
    global: 'globalThis'
  },
  optimizeDeps: {
    // Vuetify 4 공식 가이드: 개발 모드에서 다이얼로그 안의 메뉴/셀렉트/툴팁이 뒤로 가려지는 문제 방지
    include: [
      'vuetify/components/VOverlay',
      'vuetify/components/VDialog',
      'vuetify/components/VMenu',
      'vuetify/components/VSelect',
      'vuetify/components/VTooltip'
    ]
  },
  server: {
    // OAuth redirect URI(http://localhost:3000/oauth/*/redirect)와 맞추기 위해 3000 고정
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 3000,
    strictPort: true
  }
})
