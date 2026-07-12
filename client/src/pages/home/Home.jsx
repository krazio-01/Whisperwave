import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Wave1 from '../../Assets/svg/Wave1';
import Wave2 from '../../Assets/svg/Wave2';
import './home.css';

const features = [
    {
        title: 'There before you look up',
        desc: "Hit send and it's already delivered — no refresh, no spinner, no wondering if it went through.",
    },
    {
        title: 'A different lock for every door',
        desc: 'Every conversation gets its own private key. If one were ever picked, the rest stay shut.',
    },
    {
        title: 'Just like picking up the phone',
        desc: 'Voice and video connect straight between devices over WebRTC — quick to connect, clear enough that you forget it\u2019s an app.',
    },
    {
        title: 'Opens like it never closed',
        desc: 'Pick up right where you left off. Your last few messages are already there, not loading.',
    },
    {
        title: "Know when they've seen it",
        desc: 'Watch the dots appear the second they start typing, and know exactly when your message actually lands.',
    },
    {
        title: 'Room for the whole group chat',
        desc: 'Start a group, hand someone the admin badge, rename it for the fifth time — all without breaking stride.',
    },
];

function Home() {
    useEffect(() => {
        const revealEls = document.querySelectorAll('.reveal');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !revealEls.length) return;

        const io = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    e.target.classList.add('in-view');
                    obs.unobserve(e.target);
                });
            },
            { threshold: 0.15 },
        );

        revealEls.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <>
            <div className="mainContainer">
                <div className="content-wrapper">
                    <div className="text-section">
                        <h3>
                            Your Identity, <br />
                            <span>Your Rules.</span>
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
                    </div>
                </div>
            </div>

            <div className="wave1">
                <Wave1 fill="#f7f2ea" />
            </div>

            <section className="section feature-section">
                <div className="section-head wrap reveal">
                    <span className="eyebrow">core features</span>
                    <h3>Four things it had to get right.</h3>
                    <p className="section-sub">Everything else on the list follows from these.</p>
                </div>

                <div className="card-grid wrap">
                    {features.map((f, i) => (
                        <article className="feature-card reveal" key={f.title}>
                            <span className="card-index">{String(i + 1).padStart(2, '0')}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section hood-section">
                <div className="section-head wrap reveal">
                    <span className="eyebrow">under the hood</span>
                    <h3>Fast because of Redis. Private because of math.</h3>
                </div>

                <div className="terminal wrap reveal">
                    <input type="radio" name="hood-tab" id="tab-enc" className="tab-radio" defaultChecked />
                    <input type="radio" name="hood-tab" id="tab-cache" className="tab-radio" />

                    <div className="tab-bar">
                        <label htmlFor="tab-enc" className="tab-label">
                            encryption.js
                        </label>
                        <label htmlFor="tab-cache" className="tab-label">
                            cache.js
                        </label>
                    </div>

                    <div className="tab-panels">
                        <pre className="tab-panel panel-enc">
                            <span className="tok-com">// derive a key unique to this conversation</span>
                            <span className="tok-key">const</span> chatKey = HMAC_SHA256(chatId, masterSecret)
                            <span className="tok-com">// stored nowhere — recomputed whenever it's needed</span>
                            <span className="tok-key">if</span> (chatKey.matches(incoming)) decrypt(message)
                            <span className="cursor" aria-hidden="true"></span>
                        </pre>
                        <pre className="tab-panel panel-cache">
                            <span className="tok-com">// newest messages first, capped at 50</span>
                            LPUSH chat:{'{chatId}'} message LTRIM chat:{'{chatId}'} 0 49
                            <span className="tok-com">// mongo only gets touched on scroll-up</span>
                            <span className="tok-key">if</span> (cacheMiss) fetchFromMongo(chatId)
                            <span className="cursor" aria-hidden="true"></span>
                        </pre>
                    </div>
                </div>
            </section>

            <section className="section cta">
                <div className="cta-inner wrap reveal">
                    <div className="cta-text">
                        <h3>Pick a name. Start talking.</h3>
                        <span className="cta-note">free · no phone number · no hassle</span>
                    </div>
                    <Link to="/register" className="cta-btn">
                        Get started now
                    </Link>
                </div>
            </section>

            <div className="wave2">
                <Wave2 fill="#1e1e1e" />
            </div>
        </>
    );
}

export default Home;
