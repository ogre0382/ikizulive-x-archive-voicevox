import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playVoice } from '../services/voicevox';
import { allPosts, type PostInfo, memberSettingsMap } from './index'; // memberSettingsMap をインポート

interface PostPlayerControlsProps {
  postId: string;
  text: string;
  onEnded: (postId: string) => void;
  userId: string; // userId を追加
}

export const PostPlayerControls: React.FC<PostPlayerControlsProps> = ({ postId, text, onEnded, userId }) => { // userId をプロップとして受け取る
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const controlsRef = useRef<HTMLDivElement>(null);

  const postInfoRef = useRef<PostInfo | undefined>(undefined);
  useEffect(() => {
    postInfoRef.current = allPosts.find(post => post.id === postId);
    // playFunction を設定
    if (postInfoRef.current) {
        postInfoRef.current.playFunction = handlePlay;
    }
  }, [postId]);

  const stopOtherAudios = useCallback(() => {
    allPosts.forEach(post => {
      if (post.id !== postId && post.audioElement && !post.audioElement.paused) {
        post.audioElement.pause();
        post.audioElement.currentTime = 0;
        if (post.element) {
            post.element.style.backgroundColor = '';
        }
        post.isPlaying = false;
      }
    });
  }, [postId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (postInfoRef.current) {
          // prefetched audio URL の cleanup
          if ((postInfoRef.current as any).prefetchedAudioUrl?.startsWith('blob:')) {
              URL.revokeObjectURL((postInfoRef.current as any).prefetchedAudioUrl);
          }
          (postInfoRef.current as any).prefetchedAudioUrl = undefined;
          (postInfoRef.current as any).prefetchedBlob = undefined;
          
          postInfoRef.current.audioElement = null;
          postInfoRef.current.isPlaying = false;
          postInfoRef.current.playFunction = undefined;
      }
    };
  }, []);

  const handlePlay = useCallback(async (
    // MEMBERごとの設定をmemberSettingsMapから取得してデフォルト値として利用
    speakerId: number = memberSettingsMap.get(userId)?.speakerId || 0,
    pitch: number = memberSettingsMap.get(userId)?.pitch || 0,
    intonationScale: number = memberSettingsMap.get(userId)?.intonationScale || 1,
    speed: number = memberSettingsMap.get(userId)?.speed || 1
  ) => {
    const currentPostInfo = postInfoRef.current;
    if (!currentPostInfo) return;

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      currentPostInfo.isPlaying = false;
      if (currentPostInfo.element) {
          currentPostInfo.element.style.backgroundColor = '';
      }
      return;
    }

    stopOtherAudios();

    setIsPlaying(true);
    currentPostInfo.isPlaying = true;

    if (currentPostInfo.element) {
        currentPostInfo.element.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
    }

    // 事前DLがあればそれを利用し、なければ API を叩いて取得する
    let audio: HTMLAudioElement | null = null;
    if (currentPostInfo && (currentPostInfo as any).prefetchedAudioUrl) {
      audio = new Audio((currentPostInfo as any).prefetchedAudioUrl as string);
    } else {
      audio = await playVoice(text, speakerId, pitch, intonationScale, speed);
    }

    if (audio) {
      audioRef.current = audio;
      currentPostInfo.audioElement = audio;
      audio.volume = volume;
      audio.playbackRate = playbackRate;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        setIsPlaying(false);
        currentPostInfo.isPlaying = false;
        setCurrentTime(0);
        if (currentPostInfo.element) {
            currentPostInfo.element.style.backgroundColor = '';
        }
        onEnded(postId);
      };

      // すべてハンドラをセットしたら再生を開始
      try {
        await audio.play();
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    } else {
      setIsPlaying(false);
      currentPostInfo.isPlaying = false;
      if (currentPostInfo.element) {
          currentPostInfo.element.style.backgroundColor = '';
      }
    }
  }, [postId, text, volume, playbackRate, stopOtherAudios, onEnded, userId]); // userId を依存配列に追加

  useEffect(() => {
    if (postInfoRef.current) {
        postInfoRef.current.playFunction = handlePlay;
    }
    return () => {
        if (postInfoRef.current) {
            postInfoRef.current.playFunction = undefined;
        }
    }
  }, [handlePlay]);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(event.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDownload = () => {
    if (audioRef.current && audioRef.current.src) {
      const a = document.createElement('a');
      a.href = audioRef.current.src;
      a.download = `voicevox_audio_${postId}_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div ref={controlsRef} style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '5px', 
      flexWrap: 'wrap',
      flexShrink: '0',
      minWidth: 'fit-content'
    }}>
      <button
        onClick={() => handlePlay()}
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
        {isPlaying ? '⏸️ 一時停止' : '▶️ 読み上げ'}
      </button>

      {/* プログレスバー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleProgressChange}
          style={{ width: '120px' }}
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* ボリュームコントロール */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '80px' }}
      />
      <span>{(volume * 100).toFixed(0)}%</span>

      {/* 再生速度コントロール */}
      <select value={playbackRate} onChange={handlePlaybackRateChange} style={{ fontSize: '12px', padding: '2px 4px' }}>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1">1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
      </select>

      {/* ダウンロードボタン */}
      <button
        onClick={handleDownload}
        disabled={!audioRef.current || !audioRef.current.src}
        style={{
          cursor: 'pointer',
          fontSize: '12px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '2px 8px'
        }}
      >
        ダウンロード
      </button>
    </div>
  );
};
