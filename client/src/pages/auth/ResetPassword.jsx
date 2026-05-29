import { useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';
import Mascot from '../../components/miscellaneous/mascot/Mascot';
import './auth.css';

const ResetPassword = () => {
    const { token } = useParams();
    const password = useRef();
    const confirmPassword = useRef();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [mascotAction, setMascotAction] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.current.value !== confirmPassword.current.value) return toast.error('Passwords do not match!');

        if (password.current.value.length < 6) return toast.error('Password must be at least 6 characters');

        setLoading(true);

        try {
            const response = await axios.put(`/auth/reset-password/${token}`, {
                newPassword: password.current.value,
            });

            if (response.status === 200) {
                toast.success('Password updated successfully!');
                navigate('/login');
            }
        } catch (err) {
            console.log('md-err: ', err);
            if (err.response && err.response.data && err.response.data.message) toast.error(err.response.data.message);
            else toast.error('Invalid or expired token!');

            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper compact-form">
                <div className="auth-circle shape-right-mid"></div>
                <div className="auth-circle shape-left-mid"></div>
                <div className="auth-shadow"></div>

                <div className="auth-box">
                    <Mascot action={mascotAction} />

                    <div className="logo">
                        <Link to={'/'}>
                            <label>WhisperWave</label>
                        </Link>
                    </div>
                    <span className="title">Create New Password</span>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            className="auth-input"
                            type="password"
                            ref={password}
                            placeholder="New Password"
                            required
                            onFocus={() => setMascotAction('hiding')}
                            onBlur={() => setMascotAction('idle')}
                        />
                        <input
                            className="auth-input"
                            type="password"
                            ref={confirmPassword}
                            placeholder="Confirm New Password"
                            required
                            onFocus={() => setMascotAction('hiding')}
                            onBlur={() => setMascotAction('idle')}
                        />

                        <button disabled={loading} type="submit" className="auth-btn">
                            {loading ? <CircularProgress size={28} color="inherit" /> : <span>Update Password</span>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
