// components/MathJaxWrapper.jsx
/**
 * MathJaxWrapper Component
 *
 * This component provides automatic MathJax rendering for any LaTeX expressions in its children.
 * It wraps its content with MathJaxContext and MathJax from better-react-mathjax, using a configuration
 * that supports $...$, $$...$$, \(...\), and \[...\] delimiters. This allows you to display user-generated
 * content with inline or block LaTeX without manually wrapping each formula.
 *
 * Usage:
 *   import MathJaxWrapper from '@/components/MathJaxWrapper';
 *   ...
 *   <MathJaxWrapper>
 *     {contentWithLatex}
 *   </MathJaxWrapper>
 *
 * Zoom Support:
 *   <MathJaxWrapper zoomFactor={1.5}>
 *     {contentWithLatex}
 *   </MathJaxWrapper>
 *
 * Logging:
 *   Uses the clientLogger to log mount/unmount and any MathJax errors.
 *
 * See README.md for logging and documentation standards.
 */
import React, { useEffect, useState, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { createLogger } from '../clientLogger';
import dynamic from 'next/dynamic';

const logger = createLogger('MathJaxWrapper');

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        // Ignore erreurs de parsing LaTeX
        errorSettings: { message: [""] },
    },
    startup: {
        typeset: false // Disable initial typesetting
    },
    options: {
        // Si une erreur survient, n'affiche pas d'erreur visible
        renderActions: {
            findScript: [10, () => { }],
            typeset: [200, (doc: { typesetClear: () => void }) => {
                // Check if the document exists before calling methods on it
                if (doc && typeof doc.typesetClear === 'function') {
                    doc.typesetClear();
                }
            }],
        }
    }
};

export interface MathJaxWrapperProps {
    children: React.ReactNode;
    zoomFactor?: number; // Optional zoom factor prop
}

// Client-side only MathJax component
const ClientOnlyMathJax: React.FC<MathJaxWrapperProps> = ({ children, zoomFactor = 1 }) => {
    const [isClient, setIsClient] = useState(false);
    // Ref to track changes to zoomFactor
    const prevZoomRef = useRef(zoomFactor);

    useEffect(() => {
        setIsClient(true);
        // logger.info('MathJaxWrapper mounted');
        return () => {
            // logger.info('MathJaxWrapper unmounted');
        };
    }, []);

    useEffect(() => {
        // Log zoom factor changes
        if (isClient && prevZoomRef.current !== zoomFactor) {
            logger.debug(`MathJax zoom factor changed from ${prevZoomRef.current} to ${zoomFactor}`);
            prevZoomRef.current = zoomFactor;
        }
    }, [zoomFactor, isClient]);

    // Create an inline style for the container with scaling
    const containerStyle: React.CSSProperties = {
        fontSize: `${zoomFactor}rem`,
    };

    return (
        <MathJaxContext config={mathJaxConfig} version={3}>
            {isClient ? (
                <div style={containerStyle}>
                    <MathJax
                        dynamic={true}
                        onError={err => logger.error('MathJax error', err)}
                    >
                        {children}
                    </MathJax>
                </div>
            ) : (
                <span suppressHydrationWarning>{children}</span>
            )}
        </MathJaxContext>
    );
};

// Use Next.js dynamic import with ssr: false to completely skip server-side rendering
const MathJaxWrapper = dynamic(() => Promise.resolve(ClientOnlyMathJax), {
    ssr: false
});

export default MathJaxWrapper;
