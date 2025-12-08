import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('authUser');
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ホーム</h1>
      {!user && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => navigate('/login')} style={{ marginRight: '1rem' }}>ログイン</button>
          <button onClick={() => navigate('/signup')}>サインアップ</button>
        </div>
      )}
      {user && (
        <div style={{ marginBottom: '1rem' }}>
          <p>ようこそ {user.username} さん</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button onClick={() => navigate('/mymemo')}>自分のメモ</button>
            <button onClick={() => navigate('/followmemo')}>フォローのメモ</button>
            <button onClick={() => navigate('/follow')}>フォロー管理</button>
            <button onClick={() => { localStorage.removeItem('authUser'); window.location.reload(); }}>ログアウト</button>
          </div>
        </div>
      )}
      <p>メモアプリへようこそ。ログインしてメモを管理しましょう。</p>
      <nav style={{ marginTop: '1rem' }}>
        <p><Link to="/mymemo">自分のメモを見る</Link></p>
        <p><Link to="/followmemo">フォローユーザーのメモを見る</Link></p>
        <p><Link to="/follow">フォロー管理</Link></p>
      </nav>
    </div>
  );
}

export default Home;
