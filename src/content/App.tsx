export const App = () => {
  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
      <button onClick={() => alert('VOICEVOX 準備完了！')}>
        読み上げ機能を有効化
      </button>
    </div>
  )
}