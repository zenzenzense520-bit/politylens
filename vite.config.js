import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
  // 临时公网穿透域名每次启动会变化，预览服务需要接受该 Host。
  preview: {
    allowedHosts: ['auyevvdrdf73sn2thjzfeow3mm.srv.us'],
  },
})
