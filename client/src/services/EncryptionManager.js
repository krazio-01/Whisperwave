import CryptoJS from 'crypto-js';

class EncryptionManager {
    constructor() {
        this._secretKey = process.env.REACT_APP_CHAT_SECRET_KEY || 'default_super_secret_key';
    }

    set key(newKey) {
        this._secretKey = newKey;
    }

    encrypt(plainText) {
        if (!plainText) return '';
        try {
            return CryptoJS.AES.encrypt(plainText, this._secretKey).toString();
        } catch (error) {
            console.error('Encryption Error:', error.message);
            return plainText;
        }
    }

    decrypt(cipherText) {
        if (!cipherText || typeof cipherText !== 'string') return cipherText;

        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, this._secretKey);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            return decryptedData || cipherText;
        } catch (error) {
            return cipherText;
        }
    }
}

const encryptionManager = new EncryptionManager();

export default encryptionManager;
