import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface InlineEditProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    placeholder?: string;
    className?: string;
    maxLength?: number;
}

export default function InlineEdit({
    value,
    onSave,
    placeholder = "Enter name...",
    className = "",
    maxLength = 100
}: InlineEditProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(value);
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!editValue.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(editValue.trim());
            setIsEditing(false);
        } catch (error) {
            // Error is handled by parent component
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditValue(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave(e as any);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel(e as any);
        }
    };

    if (isEditing) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="flex-1 px-2 py-1 text-sm border border-[color:var(--border)] rounded focus:outline-none focus:border-[color:var(--primary)] bg-[color:var(--dropdown)] text-[color:var(--foreground)]"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving || !editValue.trim()}
                    className="p-1 text-[color:var(--success)] hover:bg-[color:var(--success)] hover:bg-opacity-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-1 text-[color:var(--alert)] hover:bg-[color:var(--alert)] hover:bg-opacity-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancel"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 group ${className}`}>
            <span className="flex-1">{value}</span>
            <button
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 p-1 text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)] transition-all duration-200"
                title="Edit name"
            >
                <Pencil size={14} />
            </button>
        </div>
    );
}
