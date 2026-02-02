import { useCallback } from 'react';
import { MdCallEnd, MdCall, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import './callModal.css';

const CallModal = (props) => {
    const {
        callStatus,
        localStream,
        remoteStream,
        endCall,
        acceptCall,
        callType,
        callPayload,
        isMicOn,
        isVideoOn,
        updateCallState,
        isAccepted,
    } = props;

    const isVideoCall = callType === 'video';

    // Toggle Handlers
    const toggleMic = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                updateCallState({ isMicOn: audioTrack.enabled });
            }
        }
    }, [localStream, updateCallState]);

    const toggleCamera = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                updateCallState({ isVideoOn: videoTrack.enabled });
            }
        }
    }, [localStream, updateCallState]);

    if (callStatus === 'idle') return null;

    return (
        <div className="call-modal-overlay">

            {callStatus === 'incoming' && (
                <div className="incoming-call-card">
                    <img
                        src={callPayload?.picture || 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg'}
                        alt="Caller"
                        className="caller-img"
                    />
                    <div className="incoming-text">
                        <h3>{callPayload?.name}</h3>
                        <p>{isVideoCall ? 'Incoming Video Call' : 'Incoming Voice Call'}</p>
                    </div>

                    <div className="action-buttons">
                        <button className="btn-decline" onClick={endCall}><MdCallEnd /></button>
                        <button className="btn-accept" onClick={acceptCall}><MdCall /></button>
                    </div>
                </div>
            )}

            {(callStatus === 'active' || callStatus === 'outbound') && (
                <div className="call-modal-content">

                    <div className="remote-video-container">
                        {!isVideoCall ? (
                            <div className="audio-call-card">
                                <img
                                    src={callPayload?.picture || 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg'}
                                    alt="User"
                                    className="audio-user-img"
                                />
                                <h3>{callPayload?.name || 'Unknown User'}</h3>
                                <p className="call-timer">
                                    {remoteStream
                                        ? 'Voice Call Active'
                                        : (isAccepted ? 'Connecting Audio...' : 'Ringing...')}
                                </p>

                                {remoteStream && (
                                    <video
                                        ref={(ref) => { if (ref) ref.srcObject = remoteStream; }}
                                        autoPlay
                                        playsInline
                                        style={{ display: 'none' }}
                                    />
                                )}
                            </div>
                        ) : (
                            remoteStream ? (
                                <video
                                    ref={(ref) => { if (ref) ref.srcObject = remoteStream; }}
                                    autoPlay
                                    playsInline
                                    className="remote-video"
                                />
                            ) : (
                                <div className="connecting-state">
                                    <img
                                        src={callPayload?.picture || 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg'}
                                        alt="Caller"
                                        style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 15 }}
                                    />
                                    <p>
                                        {callStatus === 'outbound'
                                            ? (isAccepted ? 'Connecting...' : 'Ringing...')
                                            : 'Connecting...'}
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    <div className={`local-video-container ${!isVideoCall ? 'hidden' : ''}`}>
                        <video
                            ref={(ref) => { if (ref) ref.srcObject = localStream; }}
                            autoPlay
                            playsInline
                            muted
                            className="local-video"
                        />
                    </div>

                    <div className="call-controls">
                        <button className={`control-btn ${!isMicOn ? 'off' : ''}`} onClick={toggleMic}>
                            {isMicOn ? <MdMic /> : <MdMicOff />}
                        </button>

                        {isVideoCall && (
                            <button className={`control-btn ${!isVideoOn ? 'off' : ''}`} onClick={toggleCamera}>
                                {isVideoOn ? <MdVideocam /> : <MdVideocamOff />}
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
