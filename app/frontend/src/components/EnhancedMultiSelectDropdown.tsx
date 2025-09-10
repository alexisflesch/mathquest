/**
 * Enhanced Multi-Select Dropdown with Incompatible Option Handling
 * 
 * This component extends the basic MultiSelectDropdown with sophisticated UX
 * for handling incompatible filter combinations. When an option becomes
 * incompatible with current selections, it shows visual feedback instead
 * of hiding or auto-deselecting the option.
 * 
 * Key features:
 * - Visual indicators for incompatible options (gray, strikethrough, warning icon)
 * - Tooltips explaining incompatibility
 * - Maintains user control over all selections
 * - Symmetric behavior across all filter types
 */

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface FilterOption {
    value: string;
    label?: string;
    isCompatible: boolean;
}

interface EnhancedMultiSelectDropdownProps {
    label?: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    incompatibleTooltip?: string;
}

const EnhancedMultiSelectDropdown: React.FC<EnhancedMultiSelectDropdownProps> = ({
    label,
    options,
    selected,
    onChange,
    placeholder = "Sélectionner...",
    disabled = false,
    className = "",
    incompatibleTooltip = "Pas de question disponible avec ce filtre"
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

    const handleToggle = (optionValue: string) => {
        if ((selected ?? []).includes(optionValue)) {
            onChange((selected ?? []).filter((t) => t !== optionValue));
        } else {
            onChange([...(selected ?? []), optionValue]);
        }
    };

    const getDisplayText = () => {
        if ((selected?.length ?? 0) === 0) return placeholder;

        // Show compatible and incompatible selections differently
        const compatibleSelected = selected.filter(sel =>
            options.find(opt => opt.value === sel)?.isCompatible !== false
        );
        const incompatibleSelected = selected.filter(sel =>
            options.find(opt => opt.value === sel)?.isCompatible === false
        );

        const parts = [];
        if (compatibleSelected.length > 0) {
            parts.push(compatibleSelected.join(", "));
        }
        if (incompatibleSelected.length > 0) {
            parts.push(`⚠️ ${incompatibleSelected.join(", ")}`);
        }

        return parts.join(" | ");
    };

    return (
        <div className={`w-full flex flex-col gap-2 ${className}`}>
            {label && <label className="font-bold text-lg mb-1 text-dropdown-foreground">{label}</label>}
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    className="border border-dropdown-border hover:border-dropdown-border-hover bg-dropdown text-dropdown px-3 py-2 w-full transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={e => { e.preventDefault(); if (!disabled) setOpen(o => !o); }}
                    type="button"
                    disabled={disabled}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className={`${(selected?.length ?? 0) === 0 ? "text-placeholder-foreground" : "text-dropdown-foreground"} truncate flex-1 text-left text-sm`}>
                            {getDisplayText()}
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
                    {options
                        .map((option) => {
                            const isSelected = (selected ?? []).includes(option.value);
                            const isIncompatible = !option.isCompatible;
                            if (!isSelected && isIncompatible) return null;

                            return (
                                <label
                                    key={option.value}
                                    className={`enhanced-dropdown-option flex items-center px-3 py-2 cursor-pointer text-sm transition-colors
                                        ${isSelected
                                            ? 'bg-dropdown-hover font-medium text-dropdown-hover-foreground'
                                            : 'text-dropdown-foreground hover:bg-dropdown-hover hover:text-dropdown-hover-foreground'}
                                        ${isIncompatible ? 'line-through text-incompatible-foreground' : ''}`}
                                    style={{ userSelect: 'none' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggle(option.value)}
                                        className="w-4 h-4 mr-2 text-dropdown-foreground border-dropdown-border bg-dropdown focus:ring-0 flex-shrink-0"
                                    />
                                    <span className="text-left flex-1">
                                        {option.label || option.value}
                                    </span>
                                    {isIncompatible && (
                                        <div
                                            className="ml-2 flex-shrink-0"
                                            title={incompatibleTooltip}
                                        >
                                            <AlertTriangle size={14} className="text-orange-500" />
                                        </div>
                                    )}
                                </label>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default EnhancedMultiSelectDropdown;
