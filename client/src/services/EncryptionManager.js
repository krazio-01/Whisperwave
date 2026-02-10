import CryptoJS from 'crypto-js';

class EncryptionManager {
    constructor() {
        this.masterSecret = process.env.REACT_APP_CHAT_SECRET_KEY || 'fallback_key';
    }

    getDynamicKey(chatId) {
        if (!chatId) return this.masterSecret;
        return CryptoJS.HmacSHA256(chatId, this.masterSecret).toString();
    }

    encrypt(plainText, chatId) {
        if (!plainText) return '';
        try {
            const dynamicKey = this.getDynamicKey(chatId);
            return CryptoJS.AES.encrypt(plainText, dynamicKey).toString();
        } catch (error) {
            return plainText;
        }
    }

    decrypt(cipherText, chatId) {
        if (!cipherText) return cipherText;
        try {
            const dynamicKey = this.getDynamicKey(chatId);
            const bytes = CryptoJS.AES.decrypt(cipherText, dynamicKey);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) throw new Error("Key mismatch");

            return decryptedData;
        } catch (error) {
            return '[Decryption Error]';
        }
    }
}

const encryptionManager = new EncryptionManager();

export default encryptionManager;
