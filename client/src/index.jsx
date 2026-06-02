import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SkeletonTheme } from 'react-loading-skeleton';
import { ToastContainer } from 'react-toastify';
import App from './App';
import ChatProvider from './context/ChatProvider';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
            <BrowserRouter>
                <ChatProvider>
                    <App />
                </ChatProvider>
            </BrowserRouter>
        </SkeletonTheme>

        <ToastContainer limit={3} toastStyle={{ fontSize: '12px' }} />
    </React.StrictMode>,
);
