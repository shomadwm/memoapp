// src/components/MemoItem.jsx

import React from 'react';
import './MemoItem.css';

function MemoItem({ memo, onEdit, onDelete, onColorChange }) {
  
  const memoDate = new Date(memo.created_at);

  //日本での日時表示のフォーマット
  // オプション1: 日本のロケールを使用して日時をフォーマット
  // memo.created_atがISO形式の文字列であることを前提としています
  const formattedDate = memoDate.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24時間表示
    timeZone: 'Asia/Tokyo' // 明示的に日本時間を指定
  });

  // オプション2: 手動でフォーマットする場合
  const handleColorChange = (e) => {
    onColorChange({ ...memo, background_color: e.target.value });
  };

  return (
    <div className="memo-item" style={{ backgroundColor: memo.background_color }}>
      <h3>{memo.title}</h3>
      <p>{memo.content}</p>
      <p className="memo-date">作成日時: {formattedDate}</p>
      <div className="memo-actions">
        <button onClick={() => onEdit(memo)}>編集</button> {/* 修正なし */}
        <button onClick={() => onDelete(memo.id)}>削除</button>
        <label>
          背景色:
          <input
            type="color"
            value={memo.background_color}
            onChange={handleColorChange}
          />
        </label>
      </div>
    </div>
  );
}

export default MemoItem;