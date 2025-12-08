import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:5000';

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) {
      setError('メールアドレスの形式が不正です');
      return;
    }
    if (password.length > 8) {
      setError('パスワードは8文字以上にしてください');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
      localStorage.setItem('authUser', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 420 }}>
      <h2>サインアップ</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>ユーザーネーム</label><br />
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>メールアドレス</label><br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>パスワード</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? '送信中...' : '登録'}</button>
      </form>
      <p style={{ marginTop: '1rem' }}>既にアカウントがありますか？ <Link to="/login">ログイン</Link></p>
      <p><Link to="/">ホームへ戻る</Link></p>
    </div>
  );
}

export default Signup;
