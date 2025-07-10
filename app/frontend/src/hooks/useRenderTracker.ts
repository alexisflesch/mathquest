import { useEffect, useRef } from 'react';

/**
 * Custom hook to track what causes component re-renders
 * Logs whenever a component re-renders and shows which props/dependencies changed
 */
export function useRenderTracker(componentName: string, props: Record<string, any>) {
    const prevProps = useRef<Record<string, any>>(props);
    const renderCount = useRef(0);

    useEffect(() => {
        renderCount.current += 1;

        const changedProps: Record<string, { prev: any; current: any }> = {};

        // Compare each prop with previous value
        Object.keys(props).forEach(key => {
            if (prevProps.current[key] !== props[key]) {
                changedProps[key] = {
                    prev: prevProps.current[key],
                    current: props[key]
                };
            }
        });

        // Log the render info
        if (Object.keys(changedProps).length > 0) {
            console.log(`🎭 [RENDER TRACKER] ${componentName} re-render #${renderCount.current}:`, {
                changedProps,
                timestamp: new Date().toISOString()
            });
        } else if (renderCount.current === 1) {
            console.log(`🎭 [RENDER TRACKER] ${componentName} initial render`);
        } else {
            console.log(`🎭 [RENDER TRACKER] ${componentName} re-render #${renderCount.current} (no prop changes - likely internal state)`);
        }

        // Update previous props
        prevProps.current = props;
    });

    return renderCount.current;
}

/**
 * Hook to track dependency changes in useEffect/useMemo/useCallback
 */
export function useDependencyTracker(hookName: string, dependencies: any[]) {
    const prevDeps = useRef<any[]>(dependencies);

    useEffect(() => {
        const changedDeps: Array<{ index: number; prev: any; current: any }> = [];

        dependencies.forEach((dep, index) => {
            if (prevDeps.current[index] !== dep) {
                changedDeps.push({
                    index,
                    prev: prevDeps.current[index],
                    current: dep
                });
            }
        });

        if (changedDeps.length > 0) {
            console.log(`🔍 [DEPENDENCY TRACKER] ${hookName} dependencies changed:`, changedDeps);
        }

        prevDeps.current = dependencies;
    });
}
