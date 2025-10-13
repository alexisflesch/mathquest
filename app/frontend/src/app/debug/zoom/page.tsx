"use client";
import React, { useState, useRef } from 'react';
import ZoomControls from '@/components/ZoomControls';

function DraggableBox({ id, children, initial }: { id: string; children: React.ReactNode; initial?: { x: number; y: number } }) {
    const [pos, setPos] = useState(initial || { x: 20, y: 20 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    return (
        <div
            onPointerDown={(e) => {
                dragging.current = true;
                offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
                (e.target as Element).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
                if (!dragging.current) return;
                setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
            }}
            onPointerUp={(e) => { dragging.current = false; try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {} }}
            style={{ position: 'absolute', left: pos.x, top: pos.y, width: 260, height: 120, background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', border: '2px solid #6dd3e3', touchAction: 'none', userSelect: 'none', cursor: 'grab' }}
            data-id={id}
        >
            {children}
        </div>
    );
}

export default function DebugZoomPage() {
    const [zoom, setZoom] = useState(1);

    return (
        <div className="p-8">
            <h1 className="text-xl font-bold mb-4">Zoom debug page</h1>
            <div style={{ width: 1000, height: 620, border: '1px solid #ddd', position: 'relative', overflow: 'hidden' }}>
                <ZoomControls
                    zoomFactor={zoom}
                    onZoomIn={() => setZoom(z => Math.min(z + 0.1, 3))}
                    onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
                />

                <div style={{ width: '100%', height: '100%', padding: 20 }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', fontSize: `${zoom}em` }}>
                        <DraggableBox id="q1" initial={{ x: 40, y: 30 }}>
                            <h2 style={{ margin: 0, fontSize: '1.5em' }}>Exemple de question</h2>
                            <p style={{ marginTop: 8, fontSize: '1em' }}>Calculer la somme des nombres...</p>
                        </DraggableBox>
                        <DraggableBox id="q2" initial={{ x: 340, y: 170 }}>
                            <div style={{ fontSize: '1em' }}>Réponse A</div>
                        </DraggableBox>
                        <DraggableBox id="q3" initial={{ x: 640, y: 320 }}>
                            <div style={{ fontSize: '1em' }}>Réponse B</div>
                        </DraggableBox>
                    </div>
                </div>
            </div>
        </div>
    );
}
