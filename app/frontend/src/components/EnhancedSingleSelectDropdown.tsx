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
            {label && <label className="font-bold text-lg mb-1">{label}</label>}
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 w-full transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className={`${value ? "text-gray-900 dark:text-gray-100" : "text-gray-500"} truncate flex-1 text-left text-sm`}>
                            {value || placeholder}
                        </span>
                        <ChevronDown
                            size={16}
                            className="ml-2 flex-shrink-0 text-gray-500"
                            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        />
                    </div>
                </button>

                <div
                    className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg mt-1 max-h-60 overflow-y-auto"
                    style={{
                        display: open ? 'block' : 'none',
                        left: '0',
                        minWidth: '100%',
                        width: 'max-content',
                        maxWidth: '300px',
                        borderRadius: 'var(--radius)',
                    }}
                >
                    <style>{`
                        .enhanced-single-dropdown-option:hover {
                            background-color: #f3f4f6 !important;
                        }
                        .dark .enhanced-single-dropdown-option:hover {
                            background-color: #374151 !important;
                        }
                    `}</style>

                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`enhanced-single-dropdown-option w-full text-left px-3 py-2 cursor-pointer text-sm ${
                                value === opt 
                                    ? 'bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100' 
                                    : 'text-gray-900 dark:text-gray-100'
                            }`}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
