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
                    className="btn btn-outline btn-lg w-full bg-dropdown text-dropdown no-dropdown-hover"
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                    style={{
                        transition: 'none',
                    }}
                >
                    <div className="flex items-center justify-between w-full min-w-0">
                        <span className={`${(selected?.length ?? 0) === 0 ? "text-placeholder" : "text-dropdown"} truncate flex-1 text-left`}>
                            {(selected?.length ?? 0) === 0 ? placeholder : (selected || []).join(", ")}
                        </span>
                        <ChevronDown
                            size={16}
                            className="ml-2 flex-shrink-0 text-gray-600 dark:text-gray-400"
                            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        />
                    </div>
                </button>
                <div
                    className="absolute z-10 w-full bg-dropdown text-dropdown rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto border border-base-200"
                    style={{
                        display: open ? 'block' : 'none',
                        minWidth: '100%',
                        width: '100%',
                    }}
                >
                    <style>{`
                        .multi-dropdown-option:hover {
                            background-color: var(--primary) !important;
                            color: var(--primary-foreground) !important;
                        }
                    `}</style>
                    {options.map((option) => (
                        <label
                            key={option}
                            className={`multi-dropdown-option flex items-center px-4 py-2 cursor-pointer ${(selected ?? []).includes(option) ? 'bg-base-200 font-bold' : ''}`}
                            style={{ userSelect: 'none' }}
                        >
                            <input
                                type="checkbox"
                                checked={(selected ?? []).includes(option)}
                                onChange={() => handleToggle(option)}
                                className="checkbox mr-2"
                            />
                            {option}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultiSelectDropdown;
