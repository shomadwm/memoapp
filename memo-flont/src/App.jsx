// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemoList from './components/MemoList';
import MemoForm from './components/MemoForm';
import Modal from './components/Modal'; // モーダルコンポーネントをインポート
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:5000';

function App() {
  const [memos, setMemos] = useState([]);
  const [editingMemo, setEditingMemo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // 新しいステート

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/memos`);
      setMemos(response.data);
    } catch (error) {
      console.error('メモの取得に失敗しました:', error);
    }
  };

  const handleAddMemo = async (newMemoData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/memos`, newMemoData);
      setMemos([response.data, ...memos]);
    } catch (error) {
      console.error('メモの追加に失敗しました:', error);
    }
  };

  const handleUpdateMemo = async (updatedMemoData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/memos/${updatedMemoData.id}`, updatedMemoData);
      setMemos(memos.map(memo =>
        memo.id === updatedMemoData.id ? response.data : memo
      ));
      setEditingMemo(null);
      setIsModalOpen(false); // 更新後にモーダルを閉じる
    } catch (error) {
      console.error('メモの更新に失敗しました:', error);
    }
  };

  const handleDeleteMemo = async (memoId) => {
    try {
      await axios.delete(`${API_BASE_URL}/memos/${memoId}`);
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
      {/* 常に表示される新規メモ追加フォーム */}
      <MemoForm onSubmit={handleAddMemo} initialData={null} />

      <MemoList
        memos={memos}
        onEdit={handleEditClick}
        onDelete={handleDeleteMemo}
        onColorChange={handleUpdateMemo}
      />

      {/* 編集モーダル */}
      <Modal isOpen={isModalOpen} onClose={handleCancelEdit}>
        <MemoForm
          onSubmit={handleUpdateMemo}
          initialData={editingMemo}
          onCancel={handleCancelEdit}
        />
      </Modal>
    </div>
  );
}

export default App;