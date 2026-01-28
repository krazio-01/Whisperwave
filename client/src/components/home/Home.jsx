import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import VanillaTilt from 'vanilla-tilt';
import Wave1 from '../../Assets/svg/Wave1';
import Wave2 from '../../Assets/svg/Wave2';
import './home.css';

function Home() {
    useEffect(() => {
        VanillaTilt.init(document.querySelectorAll('.container__card'), {
            max: 15,
            speed: 600,
            glare: true,
            'max-glare': 0.4,
        });
    }, []);

    return (
        <>
            <div className="mainContainer">
                <div className="content-wrapper">
                    <div className="text-section">
                        <h3>
                            Your Identity, <br />
                            <span className="gradient-text">Your Rules.</span>
                        </h3>
                        <p>
                            Forget contact lists and phone numbers. WhisperWave connects you purely through unique
                            usernames. Sign up, set your alias, and say hello to the world.
                        </p>
                        <div className="cta-group">
                            <Link to="/register" className="btn-primary">
                                Create Account
                            </Link>
                        </div>
                    </div>

                    <div className="animated-chat-section">
                        <div className="chat-interface">
                            <div className="chat-header">
                                <div className="dot red"></div>
                                <div className="dot yellow"></div>
                                <div className="dot green"></div>
                                <span>Sarah (Online)</span>
                            </div>

                            <div className="chat-body">
                                <div className="message received anim-1">Hey! Is this chat actually private? 🔒</div>
                                <div className="message sent anim-2">100%. End-to-end encrypted. 🛡️</div>
                                <div className="message received anim-3">That's exactly what I needed.</div>
                                <div className="typing-indicator anim-4">
                                    <span>•</span>
                                    <span>•</span>
                                    <span>•</span>
                                </div>
                            </div>
                        </div>

                        <div className="gradient-ball"></div>
                    </div>
                </div>
            </div>

            <div className="wave1">
                <Wave1 fill="#ffffff" />
            </div>

            <div className="steps-container">
                <h2 className="header-section">
                    How It <span className="gradient-text">Works</span>
                </h2>
                <div className="steps-grid">
                    <div className="step-item">
                        <div className="step-number">01</div>
                        <h3>Claim Alias</h3>
                        <p>Choose a unique username. No email or phone number required for public visibility.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number">02</div>
                        <h3>Share Username</h3>
                        <p>Share your unique username with friends or on social media to start connecting.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number">03</div>
                        <h3>Start Chatting</h3>
                        <p>Receive messages instantly in your secure inbox and reply in real-time.</p>
                    </div>
                </div>
            </div>

            <div className="qualities">
                <h2 className="header-section">Why Choose Us?</h2>
                <div className="cards">
                    <div className="container__card">
                        <div className="container__card--content">
                            <h3>True Anonymity</h3>
                            <p>
                                We don't ask for your phone number. We don't track your location.Just pick a username
                                and start chatting. Your identity is 100% yours to define.
                            </p>
                            <Link to="#">Read More</Link>
                        </div>
                    </div>
                    <div className="container__card">
                        <div className="container__card--content">
                            <h3>Zero Clutter</h3>
                            <p>
                                No ads, no algorithmic feeds, and no bloated menus. Just a clean, dark-themed interface
                                designed for one thing: talking to your friends without distractions.
                            </p>
                            <Link to="#">Read More</Link>
                        </div>
                    </div>
                    <div className="container__card">
                        <div className="container__card--content">
                            <h3>Rock Solid</h3>
                            <p>
                                We prioritize stability over hype. Built on a dependable architecture that ensures your
                                messages actually reach their destination. Simple, stable, and always online.
                            </p>
                            <Link to="#">Read More</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="final-cta">
                <h2 className="header-section">Ready to join the wave?</h2>
                <Link to="/register" className="btn-primary">
                    Get Started Now
                </Link>
            </div>

            <div className="wave2">
                <Wave2 fill="#1e1e1e" />
            </div>
        </>
    );
}

export default Home;
