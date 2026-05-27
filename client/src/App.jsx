import './App.css';
import { useRoutes, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import Home from './components/home/Home';
import About from './components/about/About';
import Contact from './components/contact/Contact';
import Register from './pages/register/Register';
import Login from './pages/login/Login';
import ChatHome from './pages/home/ChatHome';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';

axios.defaults.baseURL = import.meta.env.DEV ? `${import.meta.env.VITE_SERVER_URL}/api` : '/api';

const checkIsLoggedIn = () => {
    const user = localStorage.getItem('user');
    return user !== null && user !== 'undefined';
};

const AppLayout = () => (
    <>
        <Navbar />
        <Outlet />
        <Footer />
    </>
);

const RouteGuard = ({ isPrivate, isPublic }) => {
    const isLoggedIn = checkIsLoggedIn();

    if (isPrivate && !isLoggedIn) return <Navigate to="/login" replace />;
    if (isPublic && isLoggedIn) return <Navigate to="/home" replace />;

    return <Outlet />;
};

const routeConfig = [
    {
        element: <RouteGuard isPublic />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/', element: <Home /> },
                    { path: '/about', element: <About /> },
                    { path: '/contact', element: <Contact /> },
                ],
            },
            { path: '/login', element: <Login /> },
            { path: '/register', element: <Register /> },
            { path: '/forgot-password', element: <ForgotPassword /> },
            { path: '/reset-password/:token', element: <ResetPassword /> },
        ],
    },
    {
        element: <RouteGuard isPrivate />,
        children: [{ path: '/home', element: <ChatHome /> }],
    },
];

function App() {
    const routing = useRoutes(routeConfig);
    return routing;
}

export default App;
