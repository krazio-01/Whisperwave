import './mascot.css';

const Mascot = ({ action }) => {
    return (
        <div className="mascot-container">
            <svg viewBox="0 0 120 120" className={`mascot-svg is-${action}`}>
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="spiritGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f3e8ff', stopOpacity: 0.9 }} />
                    </linearGradient>
                </defs>

                <path
                    className="spirit-body"
                    d="M35,100 Q35,35 60,35 Q85,35 85,100 Q72,92 60,100 Q48,92 35,100 Z"
                    fill="url(#spiritGrad)"
                    stroke="#9d76ef"
                    strokeWidth="2"
                    filter="url(#glow)"
                />

                <g className="mascot-eyes">
                    <g>
                        <circle cx="50" cy="58" r="4" fill="#4a148c" />
                        <circle cx="70" cy="58" r="4" fill="#4a148c" />
                    </g>
                </g>

                <circle cx="43" cy="65" r="3" fill="#ffacc5" opacity="0.5" />
                <circle cx="77" cy="65" r="3" fill="#ffacc5" opacity="0.5" />

                <g className="mascot-hands">
                    <path
                        className="hand-left"
                        d="M33,92 Q24,92 24,85 L25,76 Q25,72 28,72 L30,74 Q32,70 36,70 Q45,72 43,85 Q43,92 33,92 Z"
                        fill="#a855f7"
                        stroke="#fff"
                        strokeWidth="1.5"
                    />
                    <path
                        className="hand-right"
                        d="M87,92 Q96,92 96,85 L95,76 Q95,72 92,72 L90,74 Q88,70 84,70 Q75,72 77,85 Q77,92 87,92 Z"
                        fill="#a855f7"
                        stroke="#fff"
                        strokeWidth="1.5"
                    />
                </g>
            </svg>
        </div>
    );
};

export default Mascot;
