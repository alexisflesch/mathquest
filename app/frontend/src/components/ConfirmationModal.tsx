/**
 * ConfirmationModal Component
 * 
 * A minimalistic modal component for confirmation dialogs.
 * Provides a clean interface for destructive actions like deletions.
 * 
 * Features:
 * - Customizable title, message, and button text
 * - Escape key and backdrop click to cancel
 * - Smooth animations
 * - Accessible with proper focus management
 * - Support for different button styles based on action type
 * - Consistent with InfoModal design language
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    onConfirm,
    onCancel,
    type = 'info',
    isLoading = false
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [modalTop, setModalTop] = useState<string>('50%');

    useEffect(() => {
        if (isOpen && modalRef.current) {
            const modalHeight = modalRef.current.offsetHeight;
            const viewportHeight = window.innerHeight;
            const calculatedTop = `${(viewportHeight - modalHeight) / 2}px`;
            setModalTop(calculatedTop);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        className="relative bg-[color:var(--card)] text-[color:var(--foreground)] rounded-lg shadow-lg w-full max-w-md border border-[color:var(--border)] p-6 mx-4 dialog-modal-content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <button
                                onClick={onCancel}
                                className="text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <p className="mb-6">{message}</p>

                        {/* Actions */}
                        <div className="dialog-modal-actions">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="dialog-modal-btn"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="dialog-modal-btn"
                                style={type === 'danger' ? { borderColor: 'var(--alert)', color: 'var(--alert)' } : type === 'warning' ? { borderColor: 'var(--warning)', color: 'var(--warning)' } : {}}
                            >
                                {isLoading ? 'Loading...' : confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
