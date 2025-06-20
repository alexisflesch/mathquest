/**
 * Multi-Select Dropdown Component
 * 
 * This component provides a customized dropdown interface that supports selecting
 * multiple options with checkboxes. It complements the CustomDropdown component
 * with similar styling but different selection behavior.
 * 
 * Key features:
 * - Multiple item selection with checkboxes
 * - Comma-separated display of selected items
 * - Click-outside detection for automatic closing
 * - Consistent styling with the MathQuest design system
 * - Optional label and placeholder
 * - Disabled state support
 * 
 * Used in the application for selecting multiple categories, themes, or other
 * attributes where users need to choose several options from a predefined list.
 */

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface MultiSelectDropdownProps {
    label?: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    label,
    options,
    selected,
    onChange,
    placeholder = "Sélectionner...",
    disabled = false,
    className = "",
}) => {
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

    const handleToggle = (option: string) => {
        if ((selected ?? []).includes(option)) {
            onChange((selected ?? []).filter((t) => t !== option));
        } else {
            onChange([...(selected ?? []), option]);
        }
    };

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
                        <span className={`${(selected?.length ?? 0) === 0 ? "text-gray-500" : "text-gray-900 dark:text-gray-100"} truncate flex-1 text-left text-sm`}>
                            {(selected?.length ?? 0) === 0 ? placeholder : (selected || []).join(", ")}
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
                        maxWidth: '300px', // Prevent extremely wide dropdowns
                        borderRadius: 'var(--radius)',
                    }}
                >
                    <style>{`
                        .multi-dropdown-option:hover {
                            background-color: #f3f4f6 !important;
                        }
                        .dark .multi-dropdown-option:hover {
                            background-color: #374151 !important;
                        }
                    `}</style>
                    {options.map((option) => (
                        <label
                            key={option}
                            className={`multi-dropdown-option flex items-center px-3 py-2 cursor-pointer text-sm ${(selected ?? []).includes(option) ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
                            style={{ userSelect: 'none' }}
                        >
                            <input
                                type="checkbox"
                                checked={(selected ?? []).includes(option)}
                                onChange={() => handleToggle(option)}
                                className="w-4 h-4 mr-2 text-gray-600 border-gray-300 rounded focus:ring-0 flex-shrink-0"
                            />
                            <span className="text-left">{option}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultiSelectDropdown;
