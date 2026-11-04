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
