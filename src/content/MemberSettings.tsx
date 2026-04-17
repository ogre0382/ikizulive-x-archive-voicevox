import React, { useState, useEffect } from 'react';

// ユーザー提供のマッピング情報
const MEMBER_SPEAKER_MAP: { [key: string]: { speakerId: number; styleName: string; defaultPitch?: number; defaultIntonationScale?: number; defaultSpeed?: number } } = {
  'polka_lion': { speakerId: 8, styleName: '春日部つむぎ（ノーマル）' },
  'My_Mai_Eld': { speakerId: 24, styleName: 'WhiteCUL（たのしい）' },
  'G_Akky304250': { speakerId: 109, styleName: '東北イタコ（ノーマル）' },
  'hanabistarmine': { speakerId: 62, styleName: '中国うさぎ（おどろき）' },
  'MiracleGoldSP': { speakerId: 54, styleName: '春歌ナナ（ノーマル）' },
  'Noricco_U': { speakerId: 14, styleName: '冥鳴ひまり（ノーマル）' },
  'Yukuri_talk': { speakerId: 29, styleName: 'No.7（ノーマル）' },
  'Rollie_twinkle': { speakerId: 17, styleName: '九州そら（セクシー）' },
  'LittlegreenCom': { speakerId: 107, styleName: '東北ずん子（ノーマル）' },
  'ShaunTheBunny': { speakerId: 108, styleName: '東北きりたん（ノーマル）' },
};

// VOICEVOX APIから取得した話者リスト (0~117)
const ALL_SPEAKERS = [
  { name: '四国めたん', styles: [{ id: 2, name: 'ノーマル' }, { id: 0, name: 'あまあま' }, { id: 6, name: 'ツンツン' }, { id: 4, name: 'セクシー' }, { id: 36, name: 'ささやき' }, { id: 37, name: 'ヒソヒソ' }] },
  { name: 'ずんだもん', styles: [{ id: 3, name: 'ノーマル' }, { id: 1, name: 'あまあま' }, { id: 7, name: 'ツンツン' }, { id: 5, name: 'セクシー' }, { id: 22, name: 'ささやき' }, { id: 38, name: 'ヒソヒソ' }, { id: 75, name: 'ヘロヘロ' }, { id: 76, name: 'なみだめ' }] },
  { name: '春日部つむぎ', styles: [{ id: 8, name: 'ノーマル' }] },
  { name: '雨晴はう', styles: [{ id: 10, name: 'ノーマル' }] },
  { name: '波音リツ', styles: [{ id: 9, name: 'ノーマル' }, { id: 65, name: 'クイーン' }] },
  { name: '玄野武宏', styles: [{ id: 11, name: 'ノーマル' }, { id: 39, name: '喜び' }, { id: 40, name: 'ツンギレ' }, { id: 41, name: '悲しみ' }] },
  { name: '白上虎太郎', styles: [{ id: 12, name: 'ふつう' }, { id: 32, name: 'わーい' }, { id: 33, name: 'びくびく' }, { id: 34, name: 'おこ' }, { id: 35, name: 'びえーん' }] },
  { name: '青山龍星', styles: [{ id: 13, name: 'ノーマル' }, { id: 81, name: '熱血' }, { id: 82, name: '不機嫌' }, { id: 83, name: '喜び' }, { id: 84, name: 'しっとり' }, { id: 85, name: 'かなしみ' }, { id: 86, name: '囁き' }] },
  { name: '冥鳴ひまり', styles: [{ id: 14, name: 'ノーマル' }] },
  { name: '九州そら', styles: [{ id: 16, name: 'ノーマル' }, { id: 15, name: 'あまあま' }, { id: 18, name: 'ツンツン' }, { id: 17, name: 'セクシー' }, { id: 19, name: 'ささやき' }] },
  { name: 'もち子さん', styles: [{ id: 20, name: 'ノーマル' }, { id: 66, name: 'セクシー／あん子' }, { id: 77, name: '泣き' }, { id: 78, name: '怒り' }, { id: 79, name: '喜び' }, { id: 80, name: 'のんびり' }] },
  { name: '剣崎雌雄', styles: [{ id: 21, name: 'ノーマル' }] },
  { name: 'WhiteCUL', styles: [{ id: 23, name: 'ノーマル' }, { id: 24, name: 'たのしい' }, { id: 25, name: 'かなしい' }, { id: 26, name: 'びえーん' }] },
  { name: '後鬼', styles: [{ id: 27, name: '人間ver.' }, { id: 28, name: 'ぬいぐるみver.' }, { id: 87, name: '人間（怒り）ver.' }, { id: 88, name: '鬼ver.' }] },
  { name: 'No.7', styles: [{ id: 29, name: 'ノーマル' }, { id: 30, name: 'アナウンス' }, { id: 31, name: '読み聞かせ' }] },
  { name: 'ちび式じい', styles: [{ id: 42, name: 'ノーマル' }] },
  { name: '櫻歌ミコ', styles: [{ id: 43, name: 'ノーマル' }, { id: 44, name: '第二形態' }, { id: 45, name: 'ロリ' }] },
  { name: '小夜/SAYO', styles: [{ id: 46, name: 'ノーマル' }] },
  { name: 'ナースロボ＿タイプＴ', styles: [{ id: 47, name: 'ノーマル' }, { id: 48, name: '楽々' }, { id: 49, name: '恐怖' }, { id: 50, name: '内緒話' }] },
  { name: '†聖騎士 紅桜†', styles: [{ id: 51, name: 'ノーマル' }] },
  { name: '雀松朱司', styles: [{ id: 52, name: 'ノーマル' }] },
  { name: '麒ヶ島宗麟', styles: [{ id: 53, name: 'ノーマル' }] },
  { name: '春歌ナナ', styles: [{ id: 54, name: 'ノーマル' }] },
  { name: '猫使アル', styles: [{ id: 55, name: 'ノーマル' }, { id: 56, name: 'おちつき' }, { id: 57, name: 'うきうき' }, { id: 110, name: 'つよつよ' }, { id: 111, name: 'へろへろ' }] },
  { name: '猫使ビィ', styles: [{ id: 58, name: 'ノーマル' }, { id: 59, name: 'おちつき' }, { id: 60, name: '人見知り' }, { id: 112, name: 'つよつよ' }] },
  { name: '中国うさぎ', styles: [{ id: 61, name: 'ノーマル' }, { id: 62, name: 'おどろき' }, { id: 63, name: 'こわがり' }, { id: 64, name: 'へろへろ' }] },
  { name: '栗田まろん', styles: [{ id: 67, name: 'ノーマル' }] },
  { name: 'あいえるたん', styles: [{ id: 68, name: 'ノーマル' }] },
  { name: '満別花丸', styles: [{ id: 69, name: 'ノーマル' }, { id: 70, name: '元気' }, { id: 71, name: 'ささやき' }, { id: 72, name: 'ぶりっ子' }, { id: 73, name: 'ボーイ' }] },
  { name: '琴詠ニア', styles: [{ id: 74, name: 'ノーマル' }] },
  { name: 'Voidoll', styles: [{ id: 89, name: 'ノーマル' }] },
  { name: 'ぞん子', styles: [{ id: 90, name: 'ノーマル' }, { id: 91, name: '低血圧' }, { id: 92, name: '覚醒' }, { id: 93, name: '実況風' }] },
  { name: '中部つるぎ', styles: [{ id: 94, name: 'ノーマル' }, { id: 95, name: '怒り' }, { id: 96, name: 'ヒソヒソ' }, { id: 97, name: 'おどおど' }, { id: 98, name: '絶望と敗北' }] },
  { name: '離途', styles: [{ id: 99, name: 'ノーマル' }, { id: 101, name: 'シリアス' }] },
  { name: '黒沢冴白', styles: [{ id: 100, name: 'ノーマル' }] },
  { name: 'ユーレイちゃん', styles: [{ id: 102, name: 'ノーマル' }, { id: 103, name: '甘々' }, { id: 104, name: '哀しみ' }, { id: 105, name: 'ささやき' }, { id: 106, name: 'ツクモちゃん' }] },
  { name: '東北ずん子', styles: [{ id: 107, name: 'ノーマル' }] },
  { name: '東北きりたん', styles: [{ id: 108, name: 'ノーマル' }] },
  { name: '東北イタコ', styles: [{ id: 109, name: 'ノーマル' }] },
  { name: 'あんこもん', styles: [{ id: 113, name: 'ノーマル' }, { id: 114, name: 'つよつよ' }, { id: 115, name: 'よわよわ' }, { id: 116, name: 'けだるげ' }, { id: 117, name: 'ささやき' }] },
];

interface MemberSettingsProps {
  userId: string; // 例: "polka_lion"
  onSettingsChange: (settings: { speakerId: number; pitch: number; intonationScale: number; speed: number }) => void;
}

export const MemberSettings: React.FC<MemberSettingsProps> = ({ userId, onSettingsChange }) => {
  const defaultSettings = MEMBER_SPEAKER_MAP[userId] || { speakerId: 0, styleName: 'ノーマル', defaultPitch: 0, defaultIntonationScale: 1, defaultSpeed: 1 };

  const [selectedSpeakerId, setSelectedSpeakerId] = useState<number>(defaultSettings.speakerId);
  const [pitch, setPitch] = useState<number>(defaultSettings.defaultPitch || 0);
  const [intonationScale, setIntonationScale] = useState<number>(defaultSettings.defaultIntonationScale || 1);
  const [speed, setSpeed] = useState<number>(defaultSettings.defaultSpeed || 1);

  // Chromeストレージから設定をロード
  useEffect(() => {
    // `window.chrome` の存在を確認し、型エラーを回避
    if (window.chrome && window.chrome.storage) {
      window.chrome.storage.sync.get([`memberSettings_${userId}`], (result: { [key: string]: any }) => { // resultの型を明示的に指定
        const storedSettings = result[`memberSettings_${userId}`];
        if (storedSettings) {
          setSelectedSpeakerId(storedSettings.speakerId);
          setPitch(storedSettings.pitch);
          setIntonationScale(storedSettings.intonationScale);
          setSpeed(storedSettings.speed);
          onSettingsChange(storedSettings); // 初期ロード時にも親に通知
        } else {
            // ストレージにない場合はデフォルト設定を通知
            onSettingsChange({
                speakerId: defaultSettings.speakerId,
                pitch: defaultSettings.defaultPitch || 0,
                intonationScale: defaultSettings.defaultIntonationScale || 1,
                speed: defaultSettings.defaultSpeed || 1,
            });
        }
      });
    }
  }, [userId]);

  // 設定が変更されたらChromeストレージに保存し、親に通知
  useEffect(() => {
    const settings = { speakerId: selectedSpeakerId, pitch, intonationScale, speed };
    if (window.chrome && window.chrome.storage) {
      window.chrome.storage.sync.set({ [`memberSettings_${userId}`]: settings });
    }
    onSettingsChange(settings);
  }, [selectedSpeakerId, pitch, intonationScale, speed, userId, onSettingsChange]);

  const handleSpeakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpeakerId(parseInt(e.target.value));
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPitch(parseFloat(e.target.value));
  };

  const handleIntonationScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIntonationScale(parseFloat(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseFloat(e.target.value));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      border: '1px solid #ccc',
      padding: '5px',
      borderRadius: '4px',
      marginLeft: '10px',
      fontSize: '10px',
      backgroundColor: '#f9f9f9',
      maxWidth: '200px', // max-width で親レイアウト計算に影響しない
      minWidth: '180px'  // 最小幅で UI つぶれを防ぐ
    }}>

      {/* 話者選択 */}
      <select value={selectedSpeakerId} onChange={handleSpeakerChange} style={{ fontSize: '10px' }}>
        {ALL_SPEAKERS.map(speaker => (
          <optgroup key={speaker.name} label={speaker.name}>
            {speaker.styles.map(style => (
              <option key={style.id} value={style.id}>
                {speaker.name} ({style.name})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* 話速 */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        話速:
        <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={handleSpeedChange} style={{ width: '80px' }} />
        <span>{speed.toFixed(1)}x</span>
      </label>

      {/* 音高 */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        音高:
        <input type="range" min="-0.5" max="0.5" step="0.05" value={pitch} onChange={handlePitchChange} style={{ width: '80px' }} />
        <span>{pitch.toFixed(2)}</span>
      </label>

      {/* 抑揚 */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        抑揚:
        <input type="range" min="0" max="2.0" step="0.1" value={intonationScale} onChange={handleIntonationScaleChange} style={{ width: '80px' }} />
        <span>{intonationScale.toFixed(1)}</span>
      </label>
    </div>
  );
};