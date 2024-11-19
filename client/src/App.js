import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import Home from './components/home/Home';
import About from './components/about/About';
import Contact from './components/contact/Contact';
import Register from './pages/register/Register';
import Login from './pages/login/Login';
import ChatHome from './pages/home/ChatHome';

axios.defaults.baseURL = `${process.env.REACT_APP_SERVER_URL}/api`;
 
const AppRoute = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const routes = [
  { path: '/', element: <AppRoute><Home /></AppRoute> },
  { path: '/about', element: <AppRoute><About /></AppRoute> },
  { path: '/contact', element: <AppRoute><Contact /></AppRoute> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/home', element: <ChatHome /> },
];

function App() {
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}

export default App;
