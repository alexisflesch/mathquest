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
            {label && (
                <label
                    className="font-bold text-lg mb-1 text-dropdown-foreground"
                >
                    {label}
                </label>
            )}
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    className="border border-dropdown-border hover:border-dropdown-border-hover bg-dropdown text-dropdown px-3 py-2 w-full transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                >
                    <div className="flex items-center justify-between w-full">
                        <span
                            className={`truncate flex-1 text-left text-sm ${(selected?.length ?? 0) === 0
                                ? 'text-placeholder-foreground'
                                : 'text-dropdown-foreground'
                                }`}
                        >
                            {(selected?.length ?? 0) === 0 ? placeholder : (selected || []).join(", ")}
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
                    {options.map((option) => {
                        const isSelected = (selected ?? []).includes(option);
                        return (
                            <label
                                key={option}
                                className={`multi-dropdown-option flex items-center px-3 py-2 cursor-pointer text-sm transition-colors
                                    ${isSelected
                                        ? 'bg-dropdown-hover font-medium text-dropdown-hover-foreground'
                                        : 'text-dropdown-foreground hover:bg-dropdown-hover hover:text-dropdown-hover-foreground'}
                                `}
                                style={{ userSelect: 'none' }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(option)}
                                    className="w-4 h-4 mr-2 text-dropdown-foreground border-dropdown-border bg-dropdown focus:ring-0 flex-shrink-0"
                                />
                                <span className="text-left">{option}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MultiSelectDropdown;
