import React, { useState } from 'react';
import { playVoice } from '../services/voicevox';

interface Props {
  text: string;
}

export const App: React.FC<Props> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    setIsPlaying(true);
    const audio = await playVoice(text);
    
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <button 
      onClick={handlePlay}
      style={{
        cursor: 'pointer',
        fontSize: '12px',
        background: isPlaying ? '#ff4500' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '2px 8px'
      }}
    >
      {isPlaying ? '再生中...' : '▶️ 読み上げ'}
    </button>
  );
};