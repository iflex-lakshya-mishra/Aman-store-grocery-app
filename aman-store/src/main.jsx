import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: false,
  onNeedRefresh() {
    updateSW(true);
    window.location.reload();
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
