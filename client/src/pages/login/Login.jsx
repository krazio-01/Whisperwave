import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';
import Mascot from '../../components/miscellaneous/mascot/Mascot';
import './login.css';

const Login = () => {
    const email = useRef();
    const password = useRef();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [mascotAction, setMascotAction] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Send a login request to the backend API using Axios
            const response = await axios.post('/auth/login', {
                email: email.current.value,
                password: password.current.value,
            });

            if (response.status === 200) {
                localStorage.setItem('user', JSON.stringify(response.data));
                toast.success('Login successful!');
                navigate('/home');
            } else toast.error('Invalid credentials!');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.Error) toast.error(err.response.data.Error);
            setLoading(false);
        }
    };

    return (
        <div className="containerLogin">
            <div className="login-div">
                <div className="loginCircle lOne"></div>
                <div className="loginCircle lTwo"></div>
                <div className="loginShadow"></div>

                <div className="loginBox">
                    <Mascot action={mascotAction} />

                    <div className="logo">
                        <Link to={'/'}>
                            <label>WhisperWave</label>
                        </Link>
                    </div>
                    <span className="title">Welcome Back!</span>

                    <form onSubmit={handleSubmit} className="loginForm">
                        <input
                            className="loginInput"
                            type="email"
                            ref={email}
                            placeholder="Email"
                            onFocus={() => setMascotAction('looking')}
                            onBlur={() => setMascotAction('idle')}
                        />
                        <input
                            className="loginInput"
                            type="password"
                            ref={password}
                            placeholder="Password"
                            onFocus={() => setMascotAction('hiding')}
                            onBlur={() => setMascotAction('idle')}
                        />
                        <button disabled={loading} type="submit" className="loginBtn">
                            {loading ? <CircularProgress size={28} color="inherit" /> : <span>Login</span>}
                        </button>
                    </form>

                    <p>
                        Don't have an account? &nbsp; <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
