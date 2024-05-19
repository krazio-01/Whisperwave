import React from 'react';
import App from './App';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatProvider from './context/ChatProvider';
import { BrowserRouter } from "react-router-dom";
import { SkeletonTheme } from 'react-loading-skeleton';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <BrowserRouter>
        <ChatProvider>
          <App />
          <ToastContainer limit={3} toastStyle={{ fontSize: '12px' }} />
        </ChatProvider>
      </BrowserRouter>
    </SkeletonTheme>
);

