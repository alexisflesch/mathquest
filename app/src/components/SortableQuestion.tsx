import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, X, Pencil } from "lucide-react";
import { formatTime } from "../utils";
import type { Response, Question, QuizState } from "../types";

// --- Types ---

interface SortableQuestionProps {
    q: Question;
    idx: number;
    isActive: boolean;
    isRunning: boolean;
    quizState: QuizState | null;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSelect: () => void;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({
    q,
    idx,
    isActive,
    isRunning,
    quizState,
    onPlay,
    onPause,
    onStop,
    onSelect,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(q.uid) });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isActive ? "#f0f4ff" : undefined,
    };
    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="rounded border p-4 shadow-sm flex flex-col gap-2 cursor-pointer">
            <div className="flex items-center gap-2">
                <span className="font-bold">Q{idx + 1}.</span>
                <span>{q.question}</span>
                {q.temps && <span className="ml-2 badge badge-info">{formatTime(q.temps)}</span>}
                <button className="ml-auto btn btn-xs btn-outline" onClick={onSelect}><Pencil size={14} /></button>
            </div>
            <ul className="ml-6 list-disc">
                {q.reponses.map((r, i) => (
                    <li key={i} className={r.correct ? "text-green-700" : "text-gray-700"}>
                        {r.texte} {r.correct ? <Check size={12} className="inline" /> : <X size={12} className="inline" />}
                    </li>
                ))}
            </ul>
            <div className="flex gap-2 mt-2">
                <button className="btn btn-xs btn-success" onClick={onPlay} disabled={isRunning}>Démarrer</button>
                <button className="btn btn-xs btn-warning" onClick={onPause} disabled={!isRunning}>Pause</button>
                <button className="btn btn-xs btn-error" onClick={onStop}>Stop</button>
            </div>
        </li>
    );
};

const MemoSortableQuestion = React.memo(SortableQuestion);

export default SortableQuestion;
export { MemoSortableQuestion };
