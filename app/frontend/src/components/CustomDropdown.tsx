/**
 * Custom Dropdown Component
 * 
 * This component provides a customized, accessible dropdown select interface
 * with consistent styling that matches the MathQuest design system.
 * 
 * Key features:
 * - Custom styling with theme variable integration
 * - Click-outside detection for automatic closing
 * - Optional label and placeholder text
 * - Disabled state support
 * - Custom hover effects on options
 * - Keyboard accessibility
 * 
 * Used throughout the application for single-selection inputs where
 * a standard HTML select element doesn't provide enough styling control.
 */

import React, { useState, useRef, useEffect } from "react";

interface CustomDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Sélectionner...",
    label,
    disabled = false,
    className = ""
}: CustomDropdownProps) {
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
            {label && <label className="font-bold text-lg">{label}</label>}
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    className="btn btn-outline btn-lg w-full text-left bg-dropdown text-dropdown no-dropdown-hover"
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                    style={{
                        // Remove hover effect on the dropdown button itself
                        transition: 'none',
                    }}
                >
                    <span className={value ? "text-dropdown" : "text-placeholder"}>
                        {value || placeholder}
                    </span>
                    <span className="float-right ml-2 select-none text-primary">▼</span>
                </button>
                <div
                    className="absolute z-10 w-full bg-dropdown rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto border border-base-200"
                    style={{
                        display: open ? 'block' : 'none',
                    }}
                >
                    <style>
                        {`
                        .custom-dropdown-option:hover {
                            background-color: var(--primary) !important;
                            color: var(--primary-foreground) !important;
                        }
                        `}
                    </style>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`custom-dropdown-option w-full text-left px-4 py-2 cursor-pointer ${value === opt ? 'bg-base-200 font-bold' : ''}`}
                            style={{
                                border: "none",
                                outline: "none",
                                background: "none",
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
