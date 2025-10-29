// components/MathJaxWrapper.jsx
/**
 * MathJaxWrapper Component
 *
 * This component provides automatic MathJax rendering for any LaTeX expressions in its children.
 * It wraps its content with MathJaxContext and MathJax from better-react-mathjax, using a configuration
 * that supports \(...\), and \[...\] delimiters. This allows you to display user-generated
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
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { createLogger } from '../clientLogger';
import dynamic from 'next/dynamic';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('MathJaxWrapper');

const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
        processEscapes: true,
        // Prefer line breaking to horizontal scrollbars when feasible
        chtml: {
            displayAlign: 'left',
        },
        linebreaks: { automatic: true, width: 'container' },
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
    className?: string;
    constrainWidth?: boolean; // Optional prop to constrain width instead of using 100%
}

// Client-side only MathJax component
const ClientOnlyMathJaxInner: React.FC<MathJaxWrapperProps> = ({ children, zoomFactor = 1, constrainWidth = false, className }) => {
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

    // Create an inline style for the container with scaling (use em so it's relative to parent)
    const containerStyle: React.CSSProperties = {
        fontSize: `${zoomFactor}em`,
    };

    // Memoize the children content as a string so we avoid re-typesetting when
    // the input hasn't changed. If children is not a string, fallback to React's
    // default identity (will re-render).
    const stringChildren = useMemo(() => {
        if (typeof children === 'string') {
            return children;
        }
        if (Array.isArray(children) && children.every(child => typeof child === 'string')) {
            return children.join('');
        }
        return undefined;
    }, [children]);

    return (
        <MathJaxContext config={mathJaxConfig} version={3}>
            {isClient ? (
                <div style={{ ...containerStyle, display: 'block', ...(constrainWidth ? {} : { width: '100%' }) }} className={className}>
                    {constrainWidth ? (
                        <>
                            {/* Constrain MathJax output to the container width and force wrapping for long inline elements */}
                            <div
                                className="mq-constrain"
                                style={{
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'normal',
                                }}
                            >
                                <MathJax
                                    dynamic={true}
                                    onError={err => logger.error('MathJax error', err)}
                                >
                                    {stringChildren !== undefined ? stringChildren : children}
                                </MathJax>
                            </div>

                            {/* Scoped global rules to ensure MathJax-generated elements (mjx-container, .MathJax etc.)
                                do not exceed the container width and wrap long content. `:global` is used because
                                MathJax renders its own elements outside React's scope. */}
                            <style jsx>{`
                                .mq-constrain :global(mjx-container),
                                .mq-constrain :global(.MathJax),
                                .mq-constrain :global(.MJX-TEX),
                                .mq-constrain :global(.mjx-math) {
                                    max-width: 100% !important;
                                    overflow-wrap: anywhere !important;
                                    word-break: break-word !important;
                                    white-space: normal !important;
                                }
                                /* Ensure SVG output scales down to container width */
                                .mq-constrain :global(svg),
                                .mq-constrain :global(svg *),
                                .mq-constrain :global(.mjx-svg) {
                                    max-width: 100% !important;
                                    height: auto !important;
                                    display: block !important;
                                }
                                /* Constrain MathJax tables and matrix structures */
                                .mq-constrain :global(mjx-table),
                                .mq-constrain :global(.mjx-mtable),
                                .mq-constrain :global(.mjx-itable),
                                .mq-constrain :global(table) {
                                    max-width: 100% !important;
                                    width: auto !important;
                                    table-layout: auto !important;
                                }
                                .mq-constrain :global(.MathJax) { display: block !important; }
                            `}</style>
                        </>
                    ) : (
                        <MathJax
                            dynamic={true}
                            onError={err => logger.error('MathJax error', err)}
                        >
                            {stringChildren !== undefined ? stringChildren : children}
                        </MathJax>
                    )}
                </div>
            ) : (
                <span suppressHydrationWarning>{children}</span>
            )}
        </MathJaxContext>
    );
};

// Wrap the inner component with React.memo so that re-renders only happen when
// props change (shallow compare). The main benefit is preventing parent re-renders
// from forcing MathJax to re-typeset when `children` content is stable.
const ClientOnlyMathJax = React.memo(ClientOnlyMathJaxInner);

// Use Next.js dynamic import with ssr: false to completely skip server-side rendering
const MathJaxWrapper = dynamic(() => Promise.resolve(ClientOnlyMathJax), {
    ssr: false
});

export default MathJaxWrapper;
