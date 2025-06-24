import * as React from "react";
import { Pencil, X, Check } from "lucide-react";

type TimerFieldProps = {
    value: string; // Format: "mm:ss"
    onChange: (newValue: string) => void;
};

export function TimerField({ value, onChange }: TimerFieldProps) {
    const [editing, setEditing] = React.useState(false);
    const [text, setText] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textRef = React.useRef(text);

    React.useEffect(() => {
        if (!editing) setText(value);
    }, [value, editing]);

    React.useEffect(() => {
        textRef.current = text;
    }, [text]);

    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing]);

    const clamp = (val: number, min: number, max: number) =>
        Math.max(min, Math.min(max, val));

    const formatTime = (min: number, sec: number) =>
        `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

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
                const newText = formatTime(mm, ss);
                setText(newText);
            };
            input.addEventListener("wheel", wheelHandler, { passive: false });
            return () => input.removeEventListener("wheel", wheelHandler);
        }
        return undefined;
    }, [editing]);

    const confirmEdit = () => {
        console.log('[TimerField] confirmEdit called', { text });
        const isValid = /^\d{1,2}:\d{2}$/.test(text);
        const [mmStr, ssStr] = text.split(":");
        const mm = parseInt(mmStr, 10);
        const ss = parseInt(ssStr, 10);
        if (isValid && !isNaN(mm) && !isNaN(ss) && mm <= 59 && ss <= 59) {
            const formatted = formatTime(mm, ss);
            console.log('[TimerField] confirmEdit: valid, committing', { formatted });
            onChange(formatted);
            setText(formatted);
        } else {
            console.log('[TimerField] confirmEdit: invalid, reverting', { value });
            setText(value); // revert
        }
        setEditing(false);
    };

    const cancelEdit = () => {
        console.log('[TimerField] cancelEdit called, reverting to', { value });
        setText(value);
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        console.log('[TimerField] handleKeyDown', { key: e.key });
        // Only allow Escape to cancel
        if (e.key === "Escape") {
            cancelEdit();
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        console.log('[TimerField] handleEditClick');
        e.stopPropagation();
        setEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        console.log('[TimerField] handleCancel');
        e.stopPropagation();
        cancelEdit();
    };

    const handleValidate = (e: React.MouseEvent) => {
        console.log('[TimerField] handleValidate');
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
                React.createElement("input", {
                    key: "input",
                    ref: inputRef,
                    value: value,
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
