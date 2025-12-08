import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import Home from './page/Home.jsx';
import Login from './page/Login.jsx';
import Signup from './page/Signup.jsx';
import Follow from './page/Follow.jsx';
import FollowMemo from './page/FollowMemo.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mymemo" element={<App />} />
        <Route path="/follow" element={<Follow />} />
        <Route path="/followmemo" element={<FollowMemo />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);