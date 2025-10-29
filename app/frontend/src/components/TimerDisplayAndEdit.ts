import * as React from "react";
import { Pencil, X, Check } from "lucide-react";

type TimerFieldProps = {
    valueMs: number; // always ms
    onChange: (newValueMs: number) => void;
};

export function TimerField({ valueMs, onChange }: TimerFieldProps) {
    // Debug logs only when ?mqdebug=1
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search?.includes('mqdebug=1')) {
            // eslint-disable-next-line no-console
            console.debug('[TimerField] valueMs prop:', valueMs);
        }
    }, [valueMs]);
    const [editing, setEditing] = React.useState(false);
    const [text, setText] = React.useState(formatTime(valueMs));
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textRef = React.useRef(text);

    React.useEffect(() => {
        if (!editing) setText(formatTime(valueMs));
    }, [valueMs, editing]);

    React.useEffect(() => {
        textRef.current = text;
    }, [text]);

    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing]);

    function clamp(val: number, min: number, max: number) {
        return Math.max(min, Math.min(max, val));
    }

    function formatTime(ms: number) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const mm = Math.floor(totalSeconds / 60);
        const ss = totalSeconds % 60;
        return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    }

    React.useEffect(() => {
        const input = inputRef.current;
        if (editing && input) {
            const wheelHandler = (e: WheelEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const selStart = input.selectionStart ?? 0;
                const selEnd = input.selectionEnd ?? 0;
                const editingMinutes =
                    selStart === selEnd &&
                    selStart <= 2 &&
                    !(selStart === 0 && selEnd === input.value.length);
                const editingSeconds =
                    selStart === 0 && selEnd === input.value.length
                        ? true
                        : !editingMinutes;
                const [mmRaw, ssRaw] = textRef.current.split(":");
                let mm = parseInt(mmRaw, 10) || 0;
                let ss = parseInt(ssRaw, 10) || 0;
                const delta = e.deltaY < 0 ? 1 : -1;
                if (editingSeconds) {
                    ss += delta;
                    if (ss > 59) {
                        ss = 0;
                        mm = clamp(mm + 1, 0, 59);
                    } else if (ss < 0) {
                        ss = 59;
                        mm = clamp(mm - 1, 0, 59);
                    }
                } else {
                    mm = clamp(mm + delta, 0, 59);
                }
                const newText = formatTime((mm * 60 + ss) * 1000);
                setText(newText);
            };
            input.addEventListener("wheel", wheelHandler, { passive: false });
            return () => input.removeEventListener("wheel", wheelHandler);
        }
        return undefined;
    }, [editing]);

    const confirmEdit = () => {
        const isValid = /^\d{1,2}:\d{2}$/.test(text);
        const [mmStr, ssStr] = text.split(":");
        const mm = parseInt(mmStr, 10);
        const ss = parseInt(ssStr, 10);
        if (isValid && !isNaN(mm) && !isNaN(ss) && mm <= 59 && ss <= 59) {
            const ms = (mm * 60 + ss) * 1000;
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.debug('[TimerField] confirmEdit: mm:ss', mm, ss, '-> ms', ms);
            }
            onChange(ms);
            setText(formatTime(ms));
        } else {
            setText(formatTime(valueMs)); // revert
        }
        setEditing(false);
    };

    const cancelEdit = () => {
        setText(formatTime(valueMs));
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            cancelEdit();
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        cancelEdit();
    };

    const handleValidate = (e: React.MouseEvent) => {
        e.stopPropagation();
        confirmEdit();
    };

    return React.createElement(
        "span",
        {
            style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
            },
        },
        editing
            ? [
                // Only log in development to avoid spamming console during typing
                (() => { if (process.env.NODE_ENV === 'development') { /* eslint-disable-next-line no-console */ console.debug('[TimerField] editing display:', text, '(', (parseInt(text.split(':')[0] || '0', 10) * 60 + parseInt(text.split(':')[1] || '0', 10)) * 1000, 'ms )'); } return null; })(),
                React.createElement("input", {
                    key: "input",
                    ref: inputRef,
                    value: text,
                    onChange: (e) =>
                        setText((e.target as HTMLInputElement).value),
                    onKeyDown: handleKeyDown,
                    className: "timer-field",
                    style: { marginRight: 4 },
                    onClick: (e) => e.stopPropagation(),
                }),
                React.createElement(
                    "button",
                    {
                        key: "validate",
                        type: "button",
                        "aria-label": "Validate timer",
                        onMouseDown: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleValidate(e);
                        },
                        style: {
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            color: "#10b981",
                        },
                    },
                    React.createElement(Check, { size: 18 })
                ),
                React.createElement(
                    "button",
                    {
                        key: "cancel",
                        type: "button",
                        "aria-label": "Cancel edit",
                        tabIndex: -1,
                        onMouseDown: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancel(e);
                        },
                        style: {
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            color: "#ef4444",
                        },
                    },
                    React.createElement(X, { size: 18 })
                ),
            ]
            : [
                // Only log in debug mode (?mqdebug=1)
                (() => { if (typeof window !== 'undefined' && window.location.search?.includes('mqdebug=1')) { /* eslint-disable-next-line no-console */ console.debug('[TimerField] readOnly display:', formatTime(valueMs), '(', valueMs, 'ms )'); } return null; })(),
                React.createElement("input", {
                    key: "input",
                    ref: inputRef,
                    value: formatTime(valueMs),
                    readOnly: true,
                    className: "timer-field",
                    style: { marginRight: 4 },
                    tabIndex: -1,
                    onClick: (e) => e.stopPropagation(),
                }),
                React.createElement(
                    "button",
                    {
                        key: "edit",
                        type: "button",
                        "aria-label": "Edit timer",
                        onClick: handleEditClick,
                        style: {
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                        },
                    },
                    React.createElement(Pencil, { size: 18 })
                ),
            ]
    );
}
