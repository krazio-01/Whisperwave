import { useState, useRef, useEffect, useCallback } from 'react';
import PeerService from '../services/peer';

const INITIAL_CALL_STATE = {
    status: 'idle', // idle | incoming | outbound | active
    type: 'video',
    payload: null,
    local: {
        stream: null,
        audio: true,
        video: true,
    },
    remote: {
        stream: null,
        audio: true,
        video: true,
    },
};

const useWebRTC = (socket, user, currentChat) => {
    const [call, setCall] = useState(INITIAL_CALL_STATE);
    const iceCandidatesQueue = useRef([]);

    const updateCallState = useCallback((keyOrObj, value) => {
        setCall((prev) => {
            if (typeof keyOrObj === 'string') return { ...prev, [keyOrObj]: { ...prev[keyOrObj], ...value } };

            return { ...prev, ...keyOrObj };
        });
    }, []);

    const cleanupCallSession = useCallback(() => {
        if (call.local.stream) call.local.stream.getTracks().forEach((t) => t.stop());
        PeerService.close();
        setCall(INITIAL_CALL_STATE);
    }, [call.local.stream]);

    const toggleMedia = useCallback(
        (kind) => {
            const { stream } = call.local;
            if (!stream) return;

            const track = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                updateCallState('local', { [kind]: track.enabled });

                const targetId = call.payload?.userId || call.payload?.from;
                if (targetId) socket.emit('call:toggle-media', { to: targetId, type: kind, status: track.enabled });
            }
        },
        [call.local, call.payload, socket, updateCallState],
    );

    const getMediaStream = useCallback(
        async (type) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: type === 'video',
                });
                updateCallState('local', { stream });
                return stream;
            } catch (error) {
                console.error('Error accessing media devices.', error);
                alert('Could not access Camera/Microphone');
                return null;
            }
        },
        [updateCallState],
    );

    const handleStartCall = useCallback(
        async (type) => {
            if (!currentChat) return;
            const targetUser = currentChat.members.find((m) => m._id !== user._id);
            if (!targetUser) return;

            updateCallState({
                status: 'outbound',
                type,
                payload: { userId: targetUser._id, name: targetUser.username, picture: targetUser.profilePicture },
            });

            const stream = await getMediaStream(type);
            if (!stream) {
                updateCallState({ status: 'idle' });
                return;
            }

            const peer = PeerService.start();
            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('call:ice-candidate', {
                        to: targetUser._id,
                        candidate: event.candidate,
                    });
                }
            };

            peer.ontrack = (event) => updateCallState('remote', { stream: event.streams[0] });

            const offer = await PeerService.getOffer();
            socket.emit('call:offer', {
                to: targetUser._id,
                from: user._id,
                offer,
                callType: type,
                callerName: user.username,
                callerPic: user.profilePicture,
            });
        },
        [currentChat, user, socket, getMediaStream, updateCallState],
    );

    const handleAcceptCall = useCallback(async () => {
        if (!call.payload) return;

        const { offer, from } = call.payload;

        updateCallState({ status: 'active', type: call.type });

        const stream = await getMediaStream(call.type);
        if (!stream) return;

        const peer = PeerService.start();
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('call:ice-candidate', { to: from, candidate: event.candidate });
            }
        };
        peer.ontrack = (event) => updateCallState('remote', { stream: event.streams[0] });

        const answer = await PeerService.getAnswer(offer);

        iceCandidatesQueue.current.forEach(async (c) => {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
                console.error(e);
            }
        });
        iceCandidatesQueue.current = [];

        socket.emit('call:answer', { to: from, answer });
    }, [call, socket, getMediaStream, updateCallState]);

    const handleEndCall = useCallback(() => {
        const targetId = call.payload?.userId || call.payload?.from;
        if (targetId) socket.emit('call:end', { to: targetId });
        cleanupCallSession();
    }, [call.payload, socket, cleanupCallSession]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onToggle = ({ type, status }) => updateCallState('remote', { [type]: status });

        const onOffer = (data) => {
            console.log('md-data: ', data);
            updateCallState({
                payload: { ...data, name: data.callerName, picture: data.callerPic },
                status: 'incoming',
                type: data.callType,
            });
            iceCandidatesQueue.current = [];
        };

        const onAnswer = async ({ answer }) => {
            if (call.status === 'outbound') {
                await PeerService.setRemoteDescription(answer);
                updateCallState({ status: 'active' });
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            const peer = PeerService.peer;
            if (peer && peer.remoteDescription) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error(e);
                }
            } else {
                iceCandidatesQueue.current.push(candidate);
            }
        };

        socket.on('call:toggle-media', onToggle);
        socket.on('call:offer', onOffer);
        socket.on('call:answer', onAnswer);
        socket.on('call:ice-candidate', onIceCandidate);
        socket.on('call:ended', cleanupCallSession);

        return () => {
            socket.off('call:toggle-media', onToggle);
            socket.off('call:offer', onOffer);
            socket.off('call:answer', onAnswer);
            socket.off('call:ice-candidate', onIceCandidate);
            socket.off('call:ended', cleanupCallSession);
        };
    }, [socket, call.status, cleanupCallSession, updateCallState]);

    return {
        call,
        updateCallState,
        toggleMedia,
        handleStartCall,
        handleAcceptCall,
        handleEndCall,
    };
};

export default useWebRTC;
