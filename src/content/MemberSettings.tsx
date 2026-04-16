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

// VOICEVOX APIから取得できる話者リスト (簡略化)
// 実際にはAPIを叩いて取得するが、ここでは仮のリスト
const ALL_SPEAKERS = [
  { id: 0, name: '四国めたん', styles: [{ id: 0, name: 'あまあま' }, { id: 1, name: 'ノーマル' }] },
  { id: 1, name: 'ずんだもん', styles: [{ id: 7, name: 'ノーマル' }, { id: 8, name: 'あまあま' }] },
  { id: 8, name: '春日部つむぎ', styles: [{ id: 8, name: 'ノーマル' }] },
  { id: 24, name: 'WhiteCUL', styles: [{ id: 24, name: 'たのしい' }] },
  { id: 109, name: '東北イタコ', styles: [{ id: 109, name: 'ノーマル' }] },
  { id: 62, name: '中国うさぎ', styles: [{ id: 62, name: 'おどろき' }] },
  { id: 54, name: '春歌ナナ', styles: [{ id: 54, name: 'ノーマル' }] },
  { id: 14, name: '冥鳴ひまり', styles: [{ id: 14, name: 'ノーマル' }] },
  { id: 29, name: 'No.7', styles: [{ id: 29, name: 'ノーマル' }] },
  { id: 17, name: '九州そら', styles: [{ id: 17, name: 'セクシー' }] },
  { id: 107, name: '東北ずん子', styles: [{ id: 107, name: 'ノーマル' }] },
  { id: 108, name: '東北きりたん', styles: [{ id: 108, name: 'ノーマル' }] },
  // ... 他の話者
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
      <span>話者設定: {userId}</span>
      
      {/* 話者選択 */}
      <select value={selectedSpeakerId} onChange={handleSpeakerChange} style={{ fontSize: '10px' }}>
        {ALL_SPEAKERS.map(speaker => (
          <optgroup key={speaker.id} label={speaker.name}>
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