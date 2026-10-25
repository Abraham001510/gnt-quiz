import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = new URL('./index.css', import.meta.url).href;
document.head.appendChild(stylesheet);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);