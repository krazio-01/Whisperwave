import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CircularProgress } from '@mui/material';
import './confirmModal.css';

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Modal action failed', error);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-overlay">
            {' '}
            <div className="confirmModal">
                <span>{message}</span>

                <div className="button-container">
                    <button id="btn1" className="modal-btn" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>

                    <button
                        id="btn2"
                        className={loading ? 'loading-modal-btn' : 'modal-btn'}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} style={{ color: '#DC1C1C' }} /> : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
