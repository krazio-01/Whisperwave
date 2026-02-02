class PeerService {
    constructor() {
        this.peer = null;
    }

    start() {
        if (!this.peer) {
            this.peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
                    },
                ],
            });
        }
        return this.peer;
    }

    async getAnswer(offer) {
        if (this.peer) {
            await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));
            return ans;
        }
    }

    async setRemoteDescription(ans) {
        if (this.peer) await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    }

    async getOffer() {
        if (this.peer) {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }
    }

    close() {
        if (this.peer) {
            this.peer.close();
            this.peer = null;
        }
    }
}

export default new PeerService();
