import ReactDOM from 'react-dom/client'
import { PostPlayerControls } from './PostPlayerControls';
import { MemberSettings } from './MemberSettings'; // MemberSettingsをインポート
import { fetchAudioBlobUrl } from '../services/voicevox'; // 事前DL用

// ポストの情報を保持する配列
export interface PostInfo {
    id: string;
    text: string;
    element: HTMLElement; // ポスト全体のDOM要素 (例: article._article_i6t0e_1)
    controlsContainer: HTMLSpanElement; // PostPlayerControlsがマウントされるコンテナ

    audioElement?: HTMLAudioElement | null; // PostPlayerControlsで生成されたaudio要素への参照
    isPlaying?: boolean; // PostPlayerControlsでの再生状態
    playFunction?: (speakerId?: number, pitch?: number, intonationScale?: number, speed?: number) => Promise<void>;

    // 事前ダウンロードされた音声のオブジェクトURLとBlob（存在する場合）
    prefetchedAudioUrl?: string;
    prefetchedBlob?: Blob;

    userId: string; // ポストに紐づくユーザーID
}

export const allPosts: PostInfo[] = []; // 全ポストの情報を保持（エクスポート）

// MEMBERごとの設定をグローバルに管理するMap
export const memberSettingsMap = new Map<string, { speakerId: number; pitch: number; intonationScale: number; speed: number }>();

export const scrollToPost = (element: HTMLElement) => {
    if (!element) return;
    
    // 画面中央に表示するようにスクロール（smooth animation）
    const elementRect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const scrollTarget = window.scrollY + elementRect.top - (windowHeight / 2) + (elementRect.height / 2);
    
    window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth'
    });
};

export const playNextPost = async (currentPostId: string) => {
    const currentIndex = allPosts.findIndex(post => post.id === currentPostId);
    if (currentIndex === -1) {
        return;
    }

    for (let i = currentIndex + 1; i < allPosts.length; i++) {
        const nextPost = allPosts[i];
        if (nextPost && nextPost.playFunction && !nextPost.isPlaying) {
            // 次のポストをスムーズにスクロール（画面中央に表示）
            scrollToPost(nextPost.element);
            
            // 次のポストのMEMBER設定をmemberSettingsMapから取得して渡す
            const settings = memberSettingsMap.get(nextPost.userId) || { speakerId: 0, pitch: 0, intonationScale: 1, speed: 1 };
            await nextPost.playFunction(
                settings.speakerId,
                settings.pitch,
                settings.intonationScale,
                settings.speed
            );
            return;
        }
    }
};

// MEMBER UI 注入処理 - 初回のみ実行
let memberSettingsInjected = false;
const injectMemberSettingsUI = () => {
  if (memberSettingsInjected) return; // 初回のみ実行

  const memberLinks = document.querySelectorAll('div.max-w-60.flex.flex-col.items-center.gap-3 > div.flex.flex-col.gap-3 > a');

  memberLinks.forEach((memberLink) => {
    const href = memberLink.getAttribute('href');
    if (href) {
      const match = href.match(/\?from=([^&]+)/);
      if (match && match[1]) {
        const userId = match[1];

        const memberSettingsContainer = document.createElement('div');
        memberSettingsContainer.className = 'voicevox-member-settings-injected';
        memberSettingsContainer.setAttribute('data-user-id', userId);
        memberSettingsContainer.style.flexShrink = '0';
        memberSettingsContainer.style.flexGrow = '0';
        // memberLinkの横に挿入
        memberLink.parentNode?.insertBefore(memberSettingsContainer, memberLink.nextSibling);

        const onMemberSettingsChange = (settings: { speakerId: number; pitch: number; intonationScale: number; speed: number }) => {
            memberSettingsMap.set(userId, settings);
        };

        ReactDOM.createRoot(memberSettingsContainer).render(
            <MemberSettings userId={userId} onSettingsChange={onMemberSettingsChange} />
        );
      }
    }
  });

  memberSettingsInjected = true;
};

// ポストプレイヤーUI注入処理 - スクロール時に実行
const injectPostPlayerControlsUI = () => {
  // --- 各ポストのユーザー名の横にPostPlayerControlsを注入 ---
  const headerElements = document.querySelectorAll('div._header_nqq4j_1');

  headerElements.forEach((headerElement) => {
    const postArticleElement = headerElement.closest('article._article_i6t0e_1') as HTMLElement;
    if (!postArticleElement) return;

    // ヘッダー要素のレイアウト設定を確保（親要素の flex-wrap を有効化）
    if (headerElement instanceof HTMLElement) {
      if (!headerElement.style.flexWrap) {
        headerElement.style.flexWrap = 'wrap';
        headerElement.style.alignItems = 'center';
      }
    }

    // すでにUIを注入済みならスキップ（チェック強化）
    if (headerElement.querySelector('.voicevox-player-controls-injected')) return;

    const userIdSpan = headerElement.querySelector('._username_nqq4j_69 span') as HTMLSpanElement;
    const postUserId = userIdSpan ? userIdSpan.title.replace('@', '') : `unknown_user-${Math.random().toString(36).substring(7)}`;

    // postId の生成：data-post-idを優先的に使用
    const dataPostId = postArticleElement.getAttribute('data-post-id');
    const postId = postArticleElement.dataset.appPostId || dataPostId || `app-post-${postArticleElement.getAttribute('data-index') || Math.random().toString(36).substring(7)}`;
    
    // 既存のポスト情報を確認
    let existingPost = allPosts.find(post => post.id === postId);
    
    // 重複する postId がないかチェック
    if (allPosts.some(post => post.element === postArticleElement)) {
        return; // 同じ DOM 要素に対して既に登録済み
    }

    const controlsContainer = document.createElement('span');
    controlsContainer.className = 'voicevox-player-controls-injected';
    controlsContainer.setAttribute('data-post-id', postId);
    controlsContainer.style.marginLeft = '10px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '5px';
    controlsContainer.style.flexWrap = 'wrap';
    controlsContainer.style.flexShrink = '0';
    controlsContainer.style.flexGrow = '0';
    headerElement.appendChild(controlsContainer);

    // <p class="_root_1xq52_1"> から直接 span 内のテキストを抽出
    const postTextElement = postArticleElement.querySelector('p._root_1xq52_1') as HTMLElement;
    let text = '';
    if (postTextElement) {
        const spans = postTextElement.querySelectorAll('span');
        text = Array.from(spans).map(span => span.textContent || '').join('');
    }

    if (!existingPost) {
        existingPost = {
            id: postId,
            text: text,
            element: postArticleElement,
            controlsContainer: controlsContainer,
            userId: postUserId,
        };
        allPosts.push(existingPost);
        postArticleElement.dataset.appPostId = postId;
    }

    ReactDOM.createRoot(controlsContainer).render(
      <PostPlayerControls postId={postId} text={text} onEnded={playNextPost} userId={postUserId} />
    );
  });
};

// ページの読み込み時と、スクロール等による動的更新に対応

let prefetchTimer: any = null;
const prefetchVisiblePosts = async () => {
    // 画面内に見えているポストのみを対象にし、同時ダウンロード数を制限する
    const visible = allPosts.filter(p => {
        try {
            const rect = p.element.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        } catch (e) {
            return false;
        }
    }).filter(p => !(p as any).prefetchedAudioUrl);

    if (visible.length === 0) return;

    const CONCURRENCY = 2;
    let idx = 0;
    const worker = async () => {
        while (true) {
            const i = idx++;
            if (i >= visible.length) break;
            const post = visible[i];
            const settings = memberSettingsMap.get(post.userId) || { speakerId: 0, pitch: 0, intonationScale: 1, speed: 1 };
            try {
                const res = await fetchAudioBlobUrl(post.text, settings.speakerId, settings.pitch, settings.intonationScale, settings.speed);
                if (res) {
                    (post as any).prefetchedAudioUrl = res.audioUrl;
                    (post as any).prefetchedBlob = res.blob;
                }
            } catch (e) {
                console.warn('prefetch failed for post', post.id, e);
            }
            // 少し待ってブラウザ負荷を軽減
            await new Promise(r => setTimeout(r, 100));
        }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, visible.length) }, () => worker()));
};

const schedulePrefetch = () => {
    if (prefetchTimer) clearTimeout(prefetchTimer);
    prefetchTimer = setTimeout(() => {
        prefetchVisiblePosts().catch(() => {});
    }, 500);
};

// 初期UI注入（MEMBER設定 + 初期ポスト）
injectMemberSettingsUI();
injectPostPlayerControlsUI();
schedulePrefetch();

// Intersection Observer を使用してスクロール時の新規ポスト検出を効率的に実現
const intersectionObserver = new IntersectionObserver(
    (entries) => {
        let shouldInject = false;
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const article = entry.target.closest('article._article_i6t0e_1');
                if (article && !article.querySelector('.voicevox-player-controls-injected')) {
                    shouldInject = true;
                    break;
                }
            }
        }
        if (shouldInject) {
            injectPostPlayerControlsUI(); // ポスト UI のみ注入
            schedulePrefetch();
        }
    },
    { rootMargin: '200px' }
);

// 監視対象：article要素のみ（MEMBER リンク不要）
const observeNewElements = () => {
    document.querySelectorAll('article._article_i6t0e_1').forEach(article => {
        intersectionObserver.observe(article);
    });
};

// スクロール範囲を拡張する関数
const expandScrollRange = () => {
    const stickyElement = document.querySelector('div.sticky');
    if (stickyElement instanceof HTMLElement) {
        stickyElement.style.top = '-1800px';
    }
};

// 定期的に新しい要素がDOMに追加されていないか確認（Intersection Observer の補助）
// タイマーIDを保存して後でクリーンアップ可能に
const setupPeriodicCheck = () => {
    setInterval(() => {
        // すべての article 要素をスキャンして、UIが未注入のものを検出
        document.querySelectorAll('article._article_i6t0e_1').forEach(article => {
            if (!article.querySelector('.voicevox-player-controls-injected')) {
                injectPostPlayerControlsUI();
                schedulePrefetch();
            }
        });
        // React更新時のスタイル上書き対策
        expandScrollRange();
    }, 2000);
};

// 初期化処理
observeNewElements();
setupPeriodicCheck();
expandScrollRange();
document.addEventListener('DOMContentLoaded', expandScrollRange);