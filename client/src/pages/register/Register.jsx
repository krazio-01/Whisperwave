import './register.css';
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import avatar from '../../Assets/images/addAvatar.png';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgress } from '@mui/material';

const Register = () => {
    const username = useRef();
    const email = useRef();
    const password = useRef();
    const confirmPass = useRef();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('username', username.current.value);
        formData.append('email', email.current.value);
        formData.append('password', password.current.value);
        formData.append('confirmPass', confirmPass.current.value);
        formData.append('profilePicture', file);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            await axios.post('/auth/register', formData, config);

            toast.success('Registration successful');
            toast.success('A verification email send to your registered email', { autoClose: false });
            setLoading(false);
            navigate('/login');
        }
        catch (err) {
            if (err.response && err.response.data && err.response.data.Error)
                toast.error(err.response.data.Error);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (allowedTypes.includes(file.type)) {
                setFile(file);
                setSelectedImage(URL.createObjectURL(file));
            }
            else {
                toast.error("Please select an image!");
                e.target.value = null;
            }
        }
    };

    return (
        <div className="containerRegister">
            <div className="register-div">

                <div className="regCircle rOne"></div>
                <div className="regCircle rTwo"></div>
                <div className="regCircle rThree"></div>
                <div className="shadow"></div>

                <div className="registerBox">
                    <div className="logo">
                        <Link to="/">
                            <label>WhisperWave</label>
                        </Link>
                    </div>
                    <span className="title">Register</span>

                    <form onSubmit={handleSubmit} className='registerForm'>

                        <div className="uploadAvatar">
                            <input style={{ display: 'none' }} type="file" id="file" onChange={handleFileChange} accept='image/*' />
                            <label className="avatar" htmlFor="file">
                                {selectedImage ? <img src={selectedImage} style={{ objectFit: 'cover' }} alt='' /> : <img src={avatar} alt='' />}
                            </label>
                        </div>

                        <input className='registerInput' type="text" ref={username} placeholder="Username" />
                        <input className='registerInput' type="email" ref={email} placeholder="Email" />
                        <input className='registerInput' type="password" ref={password} minLength="1" placeholder="Password" />
                        <input className='registerInput' type="password" ref={confirmPass} placeholder="Confirm Password" />

                        <button disabled={loading} type="submit" className='customRegBtn regBtn'>
                            {loading ? <CircularProgress size={28} color="inherit" /> : <span>Register</span>}
                        </button>
                    </form>

                    <p>
                        Already have an account? &nbsp; <Link to="/login">Sign In</Link>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Register;
