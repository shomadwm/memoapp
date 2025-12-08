// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemoList from './components/MemoList';
import MemoForm from './components/MemoForm';
import Modal from './components/Modal'; // モーダルコンポーネントをインポート
import './App.css';
import { API_BASE_URL } from './config';

function App() {
  const [memos, setMemos] = useState([]);
  const [editingMemo, setEditingMemo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // 新しいステート

  const storedUser = localStorage.getItem('authUser');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (user) {
      fetchMemos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchMemos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/memos`, { params: { user_id: user.id } });
      setMemos(response.data);
    } catch (error) {
      console.error('メモの取得に失敗しました:', error);
    }
  };

  const handleAddMemo = async (newMemoData) => {
    if (!user) {
      console.error('ログインが必要です');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/memos`, { ...newMemoData, user_id: user.id });
      setMemos([response.data, ...memos]);
    } catch (error) {
      console.error('メモの追加に失敗しました:', error);
    }
  };

  const handleUpdateMemo = async (updatedMemoData) => {
    if (!user) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/memos/${updatedMemoData.id}`, { ...updatedMemoData, user_id: user.id });
      setMemos(memos.map(memo => (memo.id === updatedMemoData.id ? response.data : memo)));
      setEditingMemo(null);
      setIsModalOpen(false); // 更新後にモーダルを閉じる
    } catch (error) {
      console.error('メモの更新に失敗しました:', error);
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (!user) return;
    try {
      await axios.delete(`${API_BASE_URL}/memos/${memoId}`, { params: { user_id: user.id } });
      setMemos(memos.filter(memo => memo.id !== memoId));
    } catch (error) {
      console.error('メモの削除に失敗しました:', error);
    }
  };

  const handleEditClick = (memo) => {
    setEditingMemo(memo);
    setIsModalOpen(true); // 編集ボタンでモーダルを開く
  };

  const handleCancelEdit = () => {
    setEditingMemo(null);
    setIsModalOpen(false); // キャンセルボタンでモーダルを閉じる
  };

  return (
    <div className="App">
      <h1>メモアプリ</h1>
      {!user && <p>メモを表示・追加するにはログインしてください。</p>}
      {user && (
        <>
          <p>ログイン中: {user.username} ({user.email})</p>
          <MemoForm onSubmit={handleAddMemo} initialData={null} />
          <MemoList
            memos={memos}
            onEdit={handleEditClick}
            onDelete={handleDeleteMemo}
            onColorChange={handleUpdateMemo}
          />
          <Modal isOpen={isModalOpen} onClose={handleCancelEdit}>
            <MemoForm
              onSubmit={handleUpdateMemo}
              initialData={editingMemo}
              onCancel={handleCancelEdit}
            />
          </Modal>
        </>
      )}
    </div>
  );
}

export default App;