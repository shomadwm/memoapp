// src/components/MemoForm.jsx
import React, { useState, useEffect } from 'react';
import './MemoForm.css'; // 必要に応じてスタイルシート

function MemoForm({ onSubmit, initialData = null, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setBackgroundColor(initialData.background_color || '#FFFFFF');
    } else {
      setTitle('');
      setContent('');
      setBackgroundColor('#FFFFFF');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ id: initialData.id, title, content, background_color: backgroundColor });
    } else {
      onSubmit({ title, content, background_color: backgroundColor });
    }
    setTitle('');
    setContent('');
    setBackgroundColor('#FFFFFF');
  };

  const handleCancel = () => {
    onCancel();
    setTitle('');
    setContent('');
    setBackgroundColor('#FFFFFF');
  };

  return (
    <form className="memo-form" onSubmit={handleSubmit}>
      <h2>{initialData ? 'メモを編集' : '新しいメモを追加'}</h2>
      <input
        type="text"
        placeholder="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="内容"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      ></textarea>
      <label>
        背景色:
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
      </label>
      <button type="submit">{initialData ? '更新' : '追加'}</button>
      {initialData && <button type="button" onClick={handleCancel}>キャンセル</button>}
    </form>
  );
}

export default MemoForm;