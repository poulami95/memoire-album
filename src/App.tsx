// src/App.tsx
import React from 'react';
import { AlbumProvider } from './context/AlbumContext';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/MainLayout';
import './styles/globals.css';

export default function App() {
  return (
    <AlbumProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1412',
            color: '#f5ede3',
            border: '1px solid #3a2e28',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '14px',
          },
        }}
      />
      <MainLayout />
    </AlbumProvider>
  );
}
