import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FollowMemo.css';
import { API_BASE_URL } from '../config';

function FollowMemo() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('authUser');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowingMemos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchFollowingMemos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/memos/following`, {
        params: { user_id: user.id }
      });
      setMemos(response.data);
    } catch (error) {
      console.error('フォローユーザーのメモ取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="followmemo-page">
        <h1>フォローユーザーのメモ</h1>
        <p>ログインしてください。</p>
        <button onClick={() => navigate('/login')}>ログインへ</button>
      </div>
    );
  }

  return (
    <div className="followmemo-page">
      <h1>フォローユーザーのメモ</h1>
      <p>ログイン中: {user.username}</p>

      <div className="followmemo-actions">
        <button onClick={() => navigate('/follow')} className="manage-follow-btn">
          フォロー管理
        </button>
        <button onClick={() => navigate('/')} className="back-btn">
          ホームへ戻る
        </button>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : memos.length === 0 ? (
        <div className="no-memos">
          <p>フォローユーザーのメモがありません。</p>
          <p>誰かをフォローして、メモを見てみましょう！</p>
          <button onClick={() => navigate('/follow')}>ユーザーをフォローする</button>
        </div>
      ) : (
        <div className="followmemo-list">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className="followmemo-item"
              style={{ backgroundColor: memo.background_color || '#fff' }}
            >
              <div className="memo-header">
                <span className="memo-author">@{memo.username}</span>
                <span className="memo-date">
                  {new Date(memo.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <h3 className="memo-title">{memo.title}</h3>
              <p className="memo-content">{memo.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowMemo;
