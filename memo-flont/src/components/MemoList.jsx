// src/components/MemoList.jsx
import React from 'react';
import MemoItem from './MemoItem';
import './MemoList.css'; // 必要に応じてスタイルシート

function MemoList({ memos, onEdit, onDelete, onColorChange }) {
  return (
    <div className="memo-list">
      {memos.length === 0 ? (
        <p>メモがありません。新しいメモを作成しましょう！</p>
      ) : (
        memos.map(memo => (
          <MemoItem
            key={memo.id}
            memo={memo}
            onEdit={onEdit}
            onDelete={onDelete}
            onColorChange={onColorChange}
          />
        ))
      )}
    </div>
  );
}

export default MemoList;