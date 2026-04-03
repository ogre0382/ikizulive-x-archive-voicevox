// APIレスポンスの型定義
interface TTSQuestResponse {
  success: boolean;
  isApiKeyValid: boolean;
  speakerName: string;
  audioStatusUrl: string;
  wavDownloadUrl: string;
  mp3DownloadUrl: string;
  mp3StreamingUrl: string;
}

export const playVoice = async (text: string, speakerId: number = 3) => {
  // 1. テキストのクリーニング（絵文字除去）
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  if (!cleanText) return null;

  // 2. エンドポイントの構築
  const params = new URLSearchParams({
    text: cleanText,
    speaker: speakerId.toString(),
  });
  const apiUrl = `https://api.tts.quest/v3/voicevox/synthesis?${params.toString()}`;

  try {
    // 3. 最初のAPIリクエスト（JSONを取得）
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`APIリクエスト失敗: ${response.status}`);

    const data: TTSQuestResponse = await response.json();

    if (!data.success) {
      throw new Error("API側で音声合成に失敗しました");
    }

    // 4. レスポンスに含まれる mp3StreamingUrl を使って再生
    // (mp3DownloadUrl でも可ですが、ストリーミングの方が再生開始が早いです)
    const audio = new Audio(data.mp3StreamingUrl);
    
    // 再生開始（Promiseを返すので await 可能）
    await audio.play();
    
    return audio;
  } catch (error) {
    console.error("VOICEVOX再生エラー:", error);
    return null;
  }
};