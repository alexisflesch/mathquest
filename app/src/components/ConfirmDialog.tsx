/**
 * Confirmation Dialog Component
 * 
 * This component provides a modal dialog for user confirmations throughout the application.
 * It offers a consistent interface for presenting yes/no decisions to users.
 * 
 * Key features:
 * - Fixed overlay that blocks interaction with the underlying UI
 * - Customizable title and message
 * - Configurable button labels
 * - Callback handlers for confirm and cancel actions
 * - Consistent styling that matches the application theme
 * 
 * Used in scenarios like deleting items, abandoning changes, or confirming
 * actions that might have significant consequences.
 */

import React from "react";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Oui",
    cancelText = "Non",
}: ConfirmDialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-base-100 rounded-xl shadow-xl p-6 min-w-[320px] max-w-[90vw] border border-primary flex flex-col items-center">
                {title && <div className="text-xl font-bold mb-2 text-primary">{title}</div>}
                <div className="mb-6 text-base text-center text-base-content">{message}</div>
                <div className="flex gap-4 w-full justify-center">
                    <button
                        className="btn btn-primary px-6 font-bold"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        className="btn btn-outline px-6 font-bold"
                        style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
