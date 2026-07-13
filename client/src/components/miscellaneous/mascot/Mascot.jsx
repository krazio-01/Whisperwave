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
                        <stop offset="0%" style={{ stopColor: '#fffcf7', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f0e8d9', stopOpacity: 0.95 }} />
                    </linearGradient>
                </defs>

                <path
                    className="spirit-body"
                    d="M35,100 Q35,35 60,35 Q85,35 85,100 Q72,92 60,100 Q48,92 35,100 Z"
                    fill="url(#spiritGrad)"
                    stroke="rgba(36, 36, 36, 0.45)"
                    strokeWidth="1.5"
                    filter="url(#glow)"
                />

                <g className="mascot-eyes">
                    <g>
                        <circle cx="50" cy="58" r="4.5" fill="#3a2e22" />
                        <circle cx="70" cy="58" r="4.5" fill="#3a2e22" />
                        <circle cx="51.5" cy="56.5" r="1.4" fill="#fffcf7" />
                        <circle cx="71.5" cy="56.5" r="1.4" fill="#fffcf7" />
                    </g>
                </g>

                <circle cx="43" cy="65" r="3" fill="#26221c" opacity="0.5" />
                <circle cx="77" cy="65" r="3" fill="#26221c" opacity="0.5" />

                <g className="mascot-hands">
                    <path
                        className="hand-left"
                        d="M33,92 Q24,92 24,85 L25,76 Q25,72 28,72 L30,74 Q32,70 36,70 Q45,72 43,85 Q43,92 33,92 Z"
                        fill="#e8a173"
                        stroke="rgba(40, 30, 20, 0.3)"
                        strokeWidth="1"
                    />
                    <path
                        className="hand-right"
                        d="M87,92 Q96,92 96,85 L95,76 Q95,72 92,72 L90,74 Q88,70 84,70 Q75,72 77,85 Q77,92 87,92 Z"
                        fill="#e8a173"
                        stroke="rgba(40, 30, 20, 0.3)"
                        strokeWidth="1"
                    />
                </g>
            </svg>
        </div>
    );
};

export default Mascot;
