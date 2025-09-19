import React, { useState, useMemo, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { BarChart3, ChartNoAxesColumn, Settings2, RotateCcw, EyeOff, Eye } from 'lucide-react';

interface StatisticsChartProps {
    data: number[];
    layout?: 'top' | 'left'; // New prop for button layout
}

type ChartType = 'auto' | 'stem' | 'histogram';

const StatisticsChart: React.FC<StatisticsChartProps> = ({ data, layout = 'top' }) => {
    const plotRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Resolve CSS variable for --navbar color
    const getNavbarColor = () => {
        if (typeof window !== 'undefined') {
            return getComputedStyle(document.documentElement).getPropertyValue('--navbar')?.trim() || '#2563eb';
        }
        return '#2563eb';
    };
    const [chartType, setChartType] = useState<ChartType>('auto');
    const [hideOutliers, setHideOutliers] = useState(false);

    // Force resize when container dimensions change
    useEffect(() => {
        const resizeChart = () => {
            if (plotRef.current && plotRef.current.el) {
                // Use Plotly's relayout method to force a complete redraw
                const plotElement = plotRef.current.el;
                if (window.Plotly && window.Plotly.relayout) {
                    window.Plotly.relayout(plotElement, {
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
                // Also try the resize method
                if (window.Plotly && window.Plotly.Plots && window.Plotly.Plots.resize) {
                    window.Plotly.Plots.resize(plotElement);
                }
            }
        };

        // Use ResizeObserver to detect container size changes
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                // Small delay to ensure DOM has updated
                setTimeout(resizeChart, 50);
            });
            resizeObserver.observe(containerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }

        return () => {}; // Return empty cleanup function
    }, []);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;

        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
        const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
        const min = sorted[0];
        const max = sorted[n - 1];

        // Calculate quartiles for box plot
        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;

        // Calculate outliers
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;

        const outliers = sorted.filter(val => val < lowerFence || val > upperFence);
        const nonOutliers = sorted.filter(val => val >= lowerFence && val <= upperFence);

        return {
            mean,
            median,
            min,
            max,
            q1,
            q3,
            iqr,
            lowerFence,
            upperFence,
            outliers,
            nonOutliers,
            sorted
        };
    }, [data]);

    // Prepare chart data based on type
    const chartData = useMemo(() => {
        if (!stats) return [];

        const navbarColor = getNavbarColor();

        switch (chartType) {
            case 'histogram':
                return [{
                    type: 'histogram' as const,
                    x: hideOutliers ? stats.nonOutliers : stats.sorted,
                    marker: { color: navbarColor },
                    name: 'Values'
                }];

            case 'stem':
                // Create stem and leaf plot data
                const stemData: { [key: number]: number[] } = {};
                (hideOutliers ? stats.nonOutliers : stats.sorted).forEach(val => {
                    const stem = Math.floor(val);
                    const leaf = Math.round((val - stem) * 10);
                    if (!stemData[stem]) stemData[stem] = [];
                    stemData[stem].push(leaf);
                });

                return [{
                    type: 'scatter' as const,
                    mode: 'markers' as const,
                    x: Object.keys(stemData).map(Number),
                    y: Object.values(stemData).map(leaves => leaves.length),
                    marker: { color: navbarColor, size: 8 },
                    name: 'Stem Plot'
                }];

            case 'auto': // 'auto' - box plot
                return [{
                    type: 'box' as const,
                    y: hideOutliers ? stats.nonOutliers : stats.sorted,
                    name: 'Values',
                    marker: { color: navbarColor },
                    boxpoints: 'all' as const,
                    jitter: 0.3,
                    pointpos: -1.8
                }];
        }
    }, [stats, chartType, hideOutliers]);

    // Chart layout
    const chartLayout = useMemo(() => ({
        title: {
            text: chartType === 'histogram' ? 'Value Distribution' :
                  chartType === 'stem' ? 'Stem and Leaf Plot' :
                  'Box Plot (Auto)',
            font: { size: 16 }
        },
        xaxis: {
            title: {
                text: chartType === 'stem' ? 'Stem' : 'Value'
            },
            showgrid: true
        },
        yaxis: {
            title: {
                text: chartType === 'stem' ? 'Leaf Count' : 'Value'
            },
            showgrid: true
        },
        margin: { l: 50, r: 50, t: 50, b: 50 },
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }), [chartType]);    if (!stats) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full">
            {/* Controls */}
            <div className={`flex ${layout === 'left' ? 'flex-col space-y-2' : 'flex-wrap gap-2'} mb-4`}>
                <div className={`flex ${layout === 'left' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
                    <button
                        onClick={() => setChartType('auto')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${chartType === 'auto'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <ChartNoAxesColumn className="w-4 h-4" />
                        <span>Box Plot</span>
                    </button>

                    <button
                        onClick={() => setChartType('histogram')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${chartType === 'histogram'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Histogram</span>
                    </button>

                    <button
                        onClick={() => setChartType('stem')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${chartType === 'stem'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>Stem Plot</span>
                    </button>
                </div>

                <div className={`flex ${layout === 'left' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
                    <button
                        onClick={() => setHideOutliers(!hideOutliers)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${hideOutliers
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        {hideOutliers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span>{hideOutliers ? 'Show' : 'Hide'} Outliers</span>
                    </button>

                    <button
                        onClick={() => {
                            setChartType('auto');
                            setHideOutliers(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-semibold text-blue-700">Mean</div>
                    <div className="text-lg font-mono">{stats.mean.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-semibold text-green-700">Median</div>
                    <div className="text-lg font-mono">{stats.median.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-semibold text-purple-700">Min</div>
                    <div className="text-lg font-mono">{stats.min.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                    <div className="font-semibold text-red-700">Max</div>
                    <div className="text-lg font-mono">{stats.max.toFixed(2)}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-96 bg-white rounded-lg border border-gray-200 p-4">
                <Plot
                    ref={plotRef}
                    data={chartData}
                    layout={chartLayout}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                    config={{
                        displayModeBar: false,
                        responsive: true
                    }}
                />
            </div>
        </div>
    );
};

export default StatisticsChart;