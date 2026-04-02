import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

// ページが読み込まれたら実行
const root = document.createElement('div')
root.id = 'voicevox-extension-root'
document.body.appendChild(root)

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)