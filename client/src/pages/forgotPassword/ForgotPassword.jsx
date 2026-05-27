import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';
import Mascot from '../../components/miscellaneous/mascot/Mascot';
import '../login/login.css';

const ForgotPassword = () => {
    const email = useRef();

    const [loading, setLoading] = useState(false);
    const [mascotAction, setMascotAction] = useState('idle');
    const [isEmailSent, setIsEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('/auth/forgot-password', {
                email: email.current.value,
            });

            if (response.status === 200) {
                toast.success('Reset link sent to your email!');
                setIsEmailSent(true);
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Something went wrong!');
            }
        } finally {
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
                    <Mascot action={isEmailSent ? 'idle' : mascotAction} />

                    <div className="logo">
                        <Link to={'/'}>
                            <label>WhisperWave</label>
                        </Link>
                    </div>
                    <span className="title">Account Recovery</span>

                    {isEmailSent ? (
                        <div className="loginForm">
                            <p className='forgot-password-message'>
                                If an account exists for that email, we have sent password reset instructions. Please
                                check your inbox and spam folder.{' '}
                            </p>

                            <Link className='redirection-link' to="/login">
                                <button className="loginBtn">Back to Login</button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="loginForm">
                                <input
                                    className="loginInput"
                                    type="email"
                                    ref={email}
                                    placeholder="Enter your registered email"
                                    required
                                    onFocus={() => setMascotAction('looking')}
                                    onBlur={() => setMascotAction('idle')}
                                />

                                <button disabled={loading} type="submit" className="loginBtn">
                                    {loading ? (
                                        <CircularProgress size={28} color="inherit" />
                                    ) : (
                                        <span>Send Reset Link</span>
                                    )}
                                </button>
                            </form>

                            <p>
                                Remembered your password? &nbsp; <Link to="/login">Login</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
