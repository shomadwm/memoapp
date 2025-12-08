import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import './Follow.css';
import { API_BASE_URL } from '../config';

function Follow() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('authUser');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [follows, setFollows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFollows();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchFollows = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/follows`, {
        params: { user_id: user.id }
      });
      setFollows(response.data);
    } catch (error) {
      console.error('フォロー一覧の取得に失敗しました:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/users/search`, {
        params: { q: searchQuery, user_id: user.id }
      });
      // 既にフォロー済みのユーザーを除外
      const followedIds = follows.map(f => f.user.id);
      const filtered = response.data.filter(u => !followedIds.includes(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('ユーザー検索に失敗しました:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/follows`, {
        follower_id: user.id,
        followed_id: targetUserId
      });
      setFollows([...follows, response.data]);
      // 検索結果から削除
      setSearchResults(searchResults.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('フォローに失敗しました:', error);
      alert(error.response?.data?.error || 'フォローに失敗しました');
    }
  };

  const handleUnfollow = async (followId) => {
    if (!window.confirm('このユーザーのフォローを解除しますか？')) return;
    try {
      await axios.delete(`${API_BASE_URL}/follows/${followId}`, {
        params: { user_id: user.id }
      });
      setFollows(follows.filter(f => f.follow_id !== followId));
    } catch (error) {
      console.error('フォロー解除に失敗しました:', error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!user) {
    return (
      <div className="follow-page">
        <h1>フォロー管理</h1>
        <p>ログインしてください。</p>
        <button onClick={() => navigate('/login')}>ログインへ</button>
      </div>
    );
  }

  return (
    <div className="follow-page">
      <h1>フォロー管理</h1>
      <p>ログイン中: {user.username}</p>

      <div className="follow-actions">
        <button onClick={openModal} className="add-follow-btn">
          + ユーザーを追加
        </button>
        <button onClick={() => navigate('/')} className="back-btn">
          ホームへ戻る
        </button>
      </div>

      <h2>フォロー中のユーザー ({follows.length}人)</h2>
      {follows.length === 0 ? (
        <p className="no-follows">まだ誰もフォローしていません。</p>
      ) : (
        <ul className="follow-list">
          {follows.map((f) => (
            <li key={f.follow_id} className="follow-item">
              <div className="follow-info">
                <span className="follow-username">{f.user.username}</span>
                <span className="follow-email">{f.user.email}</span>
              </div>
              <button
                onClick={() => handleUnfollow(f.follow_id)}
                className="unfollow-btn"
              >
                フォロー解除
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="search-modal">
          <h2>ユーザーを検索</h2>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="ユーザー名を入力..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={searching}>
              {searching ? '検索中...' : '検索'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((u) => (
                <li key={u.id} className="search-result-item">
                  <div className="user-info">
                    <span className="username">{u.username}</span>
                    <span className="email">{u.email}</span>
                  </div>
                  <button
                    onClick={() => handleFollow(u.id)}
                    className="follow-btn"
                  >
                    フォロー
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <p className="no-results">該当するユーザーが見つかりません。</p>
          )}

          <button onClick={closeModal} className="close-modal-btn">
            閉じる
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Follow;
