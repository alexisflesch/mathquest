/**
 * Enhanced Single-Select Dropdown Component
 * 
 * This component provides a single-select dropdown with the same modern visual design
 * as the EnhancedMultiSelectDropdown, but without checkboxes. It matches the styling
 * of the multi-select component while providing single-selection functionality.
 * 
 * Key features:
 * - Modern border styling with gray colors
 * - Consistent with EnhancedMultiSelectDropdown visual design
 * - Single selection without checkboxes
 * - Click-outside detection for automatic closing
 * - Optional label and placeholder text
 * - Disabled state support
 * - Custom hover effects on options
 * - Keyboard accessibility
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface EnhancedSingleSelectDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function EnhancedSingleSelectDropdown({
    options,
    value,
    onChange,
    placeholder = "Sélectionner...",
    label,
    disabled = false,
    className = ""
}: EnhancedSingleSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div className={`w-full flex flex-col gap-2 ${className}`}>
            {label && <label className="font-bold text-lg mb-1 text-dropdown-foreground">{label}</label>}
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    className="border border-dropdown-border hover:border-dropdown-border-hover bg-dropdown text-dropdown-foreground px-3 py-2 w-full transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                >
                    <div className="flex items-center justify-between w-full">
                        <span
                            className={`truncate flex-1 text-left text-sm ${value ? 'text-dropdown-foreground' : 'text-placeholder-foreground'}`}
                        >
                            {value || placeholder}
                        </span>
                        <ChevronDown
                            size={16}
                            className="ml-2 flex-shrink-0 text-placeholder-foreground"
                            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        />
                    </div>
                </button>

                <div
                    className="absolute z-10 bg-dropdown text-dropdown-foreground border border-dropdown-border shadow-lg mt-1 max-h-60 overflow-y-auto"
                    style={{
                        display: open ? 'block' : 'none',
                        left: '0',
                        minWidth: '100%',
                        width: 'max-content',
                        maxWidth: '300px',
                        borderRadius: 'var(--radius)',
                    }}
                >
                    {options.map((opt) => {
                        const isSelected = value === opt;
                        return (
                            <button
                                key={opt}
                                type="button"
                                className={`enhanced-single-dropdown-option w-full text-left px-3 py-2 cursor-pointer text-sm transition-colors
                                    ${isSelected
                                        ? 'bg-dropdown-hover font-medium text-dropdown-hover-foreground'
                                        : 'text-dropdown-foreground hover:bg-dropdown-hover hover:text-dropdown-hover-foreground'}
                                `}
                                style={{
                                    border: "none",
                                    outline: "none",
                                    background: "none",
                                    userSelect: 'none'
                                }}
                                onClick={() => { onChange(opt); setOpen(false); }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
