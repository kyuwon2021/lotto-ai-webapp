import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // file:// 로 열었을 때도 경로가 깨지지 않도록 상대 경로로 빌드한다.
  base: './',
  build: {
    // 단일 HTML로 합칠 수 있도록 청크를 나누지 않는다.
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/app.[ext]',
      },
    },
  },
});
