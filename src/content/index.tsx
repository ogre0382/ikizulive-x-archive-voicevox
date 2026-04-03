import ReactDOM from 'react-dom/client'
import { App } from './App'

// 注入処理を関数化
const injectButtons = () => {
  // ポストのテキストが入っている要素をすべて取得
  // ユーザーの指定したクラス名: _root_1xq52_1
  const posts = document.querySelectorAll('p._root_1xq52_1');

  posts.forEach((post) => {
    // すでにボタンを注入済みならスキップ（二重注入防止）
    if (post.parentElement?.querySelector('.voicevox-injected')) return;

    // ボタンを配置するためのコンテナを作成
    const container = document.createElement('span');
    container.className = 'voicevox-injected';
    container.style.marginLeft = '10px';
    
    // ポストの横（または直後）に挿入
    post.appendChild(container);

    // テキスト内容を取得
    const text = (post as HTMLElement).innerText;

    // React コンポーネントをマウント
    ReactDOM.createRoot(container).render(
      <App text={text} />
    )
  });
};

// ページの読み込み時と、スクロール等による動的更新に対応
injectButtons();
const observer = new MutationObserver(injectButtons);
observer.observe(document.body, { childList: true, subtree: true });