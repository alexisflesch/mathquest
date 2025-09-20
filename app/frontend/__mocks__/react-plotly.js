import React from 'react';

// Mock Plotly component for testing
const Plot = React.forwardRef((props, ref) => {
    return React.createElement('div', {
        ref,
        'data-testid': 'plotly-chart',
        'data-chart-data': JSON.stringify(props.data || []),
        'data-chart-layout': JSON.stringify(props.layout || {}),
        'data-chart-config': JSON.stringify(props.config || {}),
        style: { width: '100%', height: '400px', ...props.style }
    },
        // Also create nested elements with different testids for tests that expect them
        React.createElement('div', {
            'data-testid': 'chart-data',
            'data-chart-data': JSON.stringify(props.data || []),
            'data-chart-layout': JSON.stringify(props.layout || {}),
            'data-chart-config': JSON.stringify(props.config || {})
        }, 'Chart Data Mock'),
        React.createElement('div', {
            'data-testid': 'chart-layout',
            'data-chart-layout': JSON.stringify(props.layout || {})
        }, 'Chart Layout Mock')
    );
});

Plot.displayName = 'PlotlyMock';

export default Plot;
