import { MdCallEnd, MdCall, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import './callModal.css';

const CallModal = ({ user, call, toggleMedia, endCall, acceptCall }) => {
    const { status, type, payload, local, remote } = call;

    const isVideoCall = type === 'video';
    const isConnecting = status === 'active' && !remote.stream;

    const handleMicToggle = () => toggleMedia('audio');
    const handleCamToggle = () => toggleMedia('video');

    if (status === 'idle') return null;

    return (
        <div className="call-modal-overlay">
            {/* incoming call*/}
            {status === 'incoming' && (
                <div className="incoming-call-card">
                    <img src={payload?.picture} alt="Caller" className="caller-img" />
                    <div className="incoming-text">
                        <h3>{payload?.name}</h3>
                        <p>{isVideoCall ? 'Incoming Video Call' : 'Incoming Voice Call'}</p>
                    </div>
                    <div className="action-buttons">
                        <button className="btn-decline" onClick={endCall}>
                            <MdCallEnd />
                        </button>
                        <button className="btn-accept" onClick={acceptCall}>
                            <MdCall />
                        </button>
                    </div>
                </div>
            )}

            {/* active/outbout state */}
            {(status === 'active' || status === 'outbound') && (
                <div className="call-modal-content">
                    {/* remote user */}
                    <div className="remote-video-container">
                        {!isVideoCall ? (
                            <div className="audio-call-card">
                                <img src={payload?.picture} alt="User" className="audio-user-img" />
                                <h3>{payload?.name || 'Unknown User'}</h3>
                                <p className="call-timer">{remote.stream ? 'Voice Call Active' : 'Connecting...'}</p>

                                {/* 1. AUDIO MUTED INDICATOR */}
                                {!remote.audio && remote.stream && (
                                    <div className="remote-muted-badge">
                                        <MdMicOff /> <span>Muted</span>
                                    </div>
                                )}

                                {remote.stream && (
                                    <video
                                        ref={(ref) => {
                                            if (ref) ref.srcObject = remote.stream;
                                        }}
                                        autoPlay
                                        playsInline
                                        style={{ display: 'none' }}
                                    />
                                )}
                            </div>
                        ) : remote.stream && remote.video ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                <video
                                    ref={(ref) => {
                                        if (ref) ref.srcObject = remote.stream;
                                    }}
                                    autoPlay
                                    playsInline
                                    className="remote-video"
                                />

                                {!remote.audio && (
                                    <div className="video-muted-overlay">
                                        <MdMicOff size={20} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="connecting-state">
                                <img className="user-profilePic" src={payload?.picture} alt="Caller" />
                                <p style={{ color: 'white', fontSize: '1.1rem' }}>
                                    {status === 'outbound'
                                        ? 'Ringing...'
                                        : isConnecting
                                            ? 'Connecting...'
                                            : 'Camera Off'}
                                </p>

                                {!remote.audio && remote.stream && (
                                    <div className="remote-muted-badge" style={{ marginTop: 10 }}>
                                        <MdMicOff /> <span>Muted</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* local stream */}
                    <div className={`local-video-container ${!isVideoCall ? 'hidden' : ''}`}>
                        {local.video ? (
                            <video
                                ref={(ref) => {
                                    if (ref) ref.srcObject = local.stream;
                                }}
                                autoPlay
                                playsInline
                                muted
                                className="local-video"
                            />
                        ) : (
                            <div className="local-off-state">
                                <img className="user-profilePic" src={user?.profilePicture} alt="Caller" />
                                <MdVideocamOff size={24} />
                                <span>Camera Off</span>
                            </div>
                        )}
                    </div>

                    <div className="call-controls">
                        <button className={`control-btn ${!local.audio ? 'off' : ''}`} onClick={handleMicToggle}>
                            {local.audio ? <MdMic /> : <MdMicOff />}
                        </button>

                        {isVideoCall && (
                            <button className={`control-btn ${!local.video ? 'off' : ''}`} onClick={handleCamToggle}>
                                {local.video ? <MdVideocam /> : <MdVideocamOff />}
                            </button>
                        )}

                        <button className="control-btn end-call" onClick={endCall}>
                            <MdCallEnd />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallModal;
