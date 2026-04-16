// VOICEVOX サービスラッパー
// デフォルトAPIキー（ユーザーが chrome.storage に独自キーを保存可能）
const DEFAULT_API_KEY = 'l757699-1-7566J';
const API_KEY_GEN_URL = 'https://su-shiki.com/api/';

async function getApiKey(): Promise<string> {
  try {
    if (window.chrome && (window.chrome as any).storage && (window.chrome as any).storage.sync) {
      return new Promise<string>((resolve) => {
        (window.chrome as any).storage.sync.get({ voicevoxApiKey: DEFAULT_API_KEY }, (items: any) => {
          resolve(items.voicevoxApiKey || DEFAULT_API_KEY);
        });
      });
    }
  } catch (e) {
    // storage が使えない場合はデフォルトにフォールバック
  }
  return DEFAULT_API_KEY;
}

// テキストをクリーンにする（絵文字除去など）
function cleanTextForApi(text: string){
  try {
    // より包括的な絵文字除去パターン
    // 1. 基本的な絵文字 (U+1F300-U+1F9FF)
    // 2. 顔文字 (U+1F600-U+1F64F)
    // 3. 装飾記号 (U+2600-U+27BF)
    // 4. 異字体修飾子 (variation selectors)
    // 5. ゼロ幅ジョイナー (ZWJ sequences)
    // 6. 肌色修飾子 (skin tone modifiers)
    let cleaned = text
      // ZWJ sequences と variation selectors を除去
      .replace(/[\u200D\uFE0F\u200B]/g, '')
      // 絵文字ブロック全て
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      // その他の装飾記号
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      // サロゲートペア対応
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    
    return cleaned.trim();
  } catch (e) {
    // フォールバック：より単純な除去方法
    return text.replace(/[\uD800-\uDFFF]/g, '').trim();
  }
}

export const fetchAudioBlobUrl = async (
  text: string,
  speakerId: number = 0,
  pitch: number = 0,
  intonationScale: number = 1,
  speed: number = 1
): Promise<{ audioUrl: string; blob: Blob } | null> => {
  const cleanText = cleanTextForApi(text);
  if (!cleanText) return null;

  const apiKey = await getApiKey();
  const params = new URLSearchParams({
    key: apiKey,
    speaker: String(speakerId),
    pitch: String(pitch),
    intonationScale: String(intonationScale),
    speed: String(speed),
    text: cleanText,
  });

  const apiUrl = `https://deprecatedapis.tts.quest/v2/voicevox/audio/?${params.toString()}`;

  try {
    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      const errText = await resp.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.error && typeof errJson.error === 'string' && errJson.error.toLowerCase().includes('key')) {
          alert(`VOICEVOX APIキーに問題があります。新しいAPIキーを取得してください: ${API_KEY_GEN_URL}`);
        }
      } catch (e) {
        console.warn('Non-JSON error from VOICEVOX API', errText);
      }
      throw new Error(`VOICEVOX API error: ${resp.status}`);
    }

    const blob = await resp.blob();
    const audioUrl = URL.createObjectURL(blob);
    return { audioUrl, blob };
  } catch (e) {
    console.error('fetchAudioBlobUrl error', e);
    return null;
  }
};

export const playVoice = async (
  text: string,
  speakerId: number = 0,
  pitch: number = 0,
  intonationScale: number = 1,
  speed: number = 1
): Promise<HTMLAudioElement | null> => {
  const res = await fetchAudioBlobUrl(text, speakerId, pitch, intonationScale, speed);
  if (!res) return null;
  const audio = new Audio(res.audioUrl);
  // 呼び出し側で play() を呼ぶ（UIで音量や再生速度を設定してから再生できるように）
  audio.onended = () => {
    try { URL.revokeObjectURL(res.audioUrl); } catch (e) {}
  };
  return audio;
};
