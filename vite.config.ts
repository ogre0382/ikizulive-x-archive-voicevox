import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

// manifest.json の内容を TypeScript で定義（静的な json ファイルより管理が楽です）
const manifest = defineManifest({
  manifest_version: 3,
  name: 'VOICEVOX ポスト読み上げ',
  version: '1.0.0',
  permissions: ['storage'],
  content_scripts: [
    {
      matches: ['https://gsm-app.com/*'],
      js: ['src/content/index.tsx'], // エントリポイントを指定
    },
  ],
  options_page: 'options.html',
})

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
})