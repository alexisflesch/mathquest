import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
    zoomFactor: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    className?: string;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoomFactor,
    onZoomIn,
    onZoomOut,
    className = '',
}) => {
    return (
        <div className={`absolute top-1 left-1 z-50 flex items-center space-x-1 p-1 bg-base-200 bg-opacity-70 rounded border border-base-300 shadow ${className}`}>
            <button
                onClick={onZoomOut}
                className="btn btn-xs btn-ghost p-1"
                aria-label="Zoom out"
                disabled={zoomFactor <= 0.5}
            >
                <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono select-none">
                {Math.round(zoomFactor * 100)}%
            </span>
            <button
                onClick={onZoomIn}
                className="btn btn-xs btn-ghost p-1"
                aria-label="Zoom in"
                disabled={zoomFactor >= 3}
            >
                <ZoomIn size={16} />
            </button>
        </div>
    );
};

export default ZoomControls;
