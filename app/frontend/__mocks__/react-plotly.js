import React from 'react';

// Mock Plotly component for testing
const Plot = React.forwardRef((props, ref) => {
    return React.createElement('div', {
        ref,
        'data-testid': 'plotly-mock',
        'data-plot-data': JSON.stringify(props.data || []),
        'data-plot-layout': JSON.stringify(props.layout || {}),
        'data-plot-config': JSON.stringify(props.config || {}),
        style: { width: '100%', height: '400px', ...props.style }
    }, 'Plotly Chart Mock');
});

Plot.displayName = 'PlotlyMock';

export default Plot;
