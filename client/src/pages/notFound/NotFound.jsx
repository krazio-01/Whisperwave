import { Link } from 'react-router-dom';
import './notFound.css';

const NotFound = () => {
    const user = localStorage.getItem('user');
    const isLoggedIn = user !== null && user !== 'undefined';

    return (
        <div className="not-found-container">
            <div className="not-found-box">
                <div className="not-found-header">
                    <h1 className="not-found-title">404</h1>
                </div>

                <div className="not-found-content">
                    <h3 className="not-found-subtitle">Looks like you're lost.</h3>
                    <p className="not-found-text">
                        We can't seem to find the page you're looking for. It might have been removed, renamed, or is
                        temporarily unavailable. Let's get you back on track:
                    </p>

                    <div className="not-found-actions">
                        {isLoggedIn ? (
                            <>
                                <Link to="/chat" className="not-found-link">
                                    <button className="not-found-btn primary">Back To Web Chat</button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/" className="not-found-link">
                                    <button className="not-found-btn primary">Return to Home</button>
                                </Link>
                                <Link to="/login" className="not-found-link">
                                    <button className="not-found-btn secondary">Sign In</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
