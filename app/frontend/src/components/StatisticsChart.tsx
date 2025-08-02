import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart3, ChartNoAxesColumn, Settings2, RotateCcw, EyeOff, Eye } from 'lucide-react';

interface StatisticsChartProps {
    data: number[];
}

type ChartType = 'auto' | 'stem' | 'histogram';

const StatisticsChart: React.FC<StatisticsChartProps> = ({ data }) => {
    // Resolve CSS variable for --navbar color
    const getNavbarColor = () => {
        if (typeof window !== 'undefined') {
            return getComputedStyle(document.documentElement).getPropertyValue('--navbar')?.trim() || '#2563eb';
        }
        return '#2563eb';
    };
    const [chartType, setChartType] = useState<ChartType>('auto');
    const [hideOutliers, setHideOutliers] = useState(false);

    const processedData = useMemo(() => {
        if (data.length === 0) return { values: [], hasOutliers: false, outlierIndices: [] };

        // Calculate quartiles for outlier detection
        const sorted = [...data].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierIndices = data
            .map((value, index) => ({ value, index }))
            .filter(({ value }) => value < lowerBound || value > upperBound)
            .map(({ index }) => index);

        const hasOutliers = outlierIndices.length > 0;
        const filteredData = hideOutliers && hasOutliers
            ? data.filter((_, index) => !outlierIndices.includes(index))
            : data;

        return {
            values: filteredData,
            hasOutliers,
            outlierIndices
        };
    }, [data, hideOutliers]);

    const chartData = useMemo(() => {
        const { values } = processedData;
        if (values.length === 0) return null;

        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
        const shouldUseStem = chartType === 'stem' ||
            (chartType === 'auto' && uniqueValues.length <= 10);

        if (shouldUseStem) {
            const navbarColor = getNavbarColor();
            // Stem plot - vertical lines from y=0 to y=frequency, plus markers at the top
            const frequencies = uniqueValues.map(value =>
                values.filter(v => v === value).length
            );

            // Vertical lines: for each x, draw from (x, 0) to (x, y)
            const lineX: (number | null)[] = [];
            const lineY: (number | null)[] = [];
            uniqueValues.forEach((x, i) => {
                lineX.push(x, x, null); // null for segment separation
                lineY.push(0, frequencies[i], null);
            });

            return {
                type: 'stem',
                plotData: [
                    {
                        x: lineX,
                        y: lineY,
                        type: 'scatter',
                        mode: 'lines',
                        line: { color: navbarColor, width: 2 },
                        name: 'Stem',
                        showlegend: false,
                    },
                    {
                        x: uniqueValues,
                        y: frequencies,
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            size: 10,
                            color: navbarColor,
                            symbol: 'circle',
                            line: { width: 2, color: navbarColor }
                        },
                        name: 'Frequency',
                        showlegend: false,
                    }
                ] as any,
                layout: {
                    // No title
                    xaxis: {
                        title: { text: 'Réponses' },
                        tickmode: "array" as const,
                        tickvals: uniqueValues,
                        ticktext: uniqueValues.map(v => v.toString())
                    },
                    yaxis: {
                        // No label
                        rangemode: "tozero" as const
                    }
                }
            };
        } else {
            // Histogram
            const navbarColor = getNavbarColor();
            return {
                type: 'histogram',
                plotData: [{
                    x: values,
                    type: 'histogram',
                    nbinsx: Math.min(Math.ceil(Math.sqrt(values.length)), 50),
                    name: 'Frequency',
                    marker: {
                        color: navbarColor,
                        line: { color: navbarColor, width: 1 },
                        opacity: 0.85
                    }
                }] as any,
                layout: {
                    // No title
                    xaxis: { title: { text: 'Réponses' } },
                    yaxis: {
                        // No label
                        rangemode: "tozero" as const
                    }
                }
            };
        }
    }, [processedData, chartType]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ width: '100%', height: '100%' }}>
                <p className="text-gray-500">No data to display</p>
            </div>
        );
    }

    if (!chartData) return null;

    return (
        <div className="w-full h-full flex flex-col" style={{ height: '100%', background: 'transparent' }}>
            {/* Controls always visible at top */}
            <div className="flex flex-wrap items-center" style={{ background: 'transparent' }}>
                <div className="flex gap-1 border rounded-lg p-1" style={{ background: 'transparent' }}>
                    <button
                        onClick={() => setChartType('auto')}
                        className={`px-3 py-2 text-sm rounded flex items-center justify-center transition-colors ${chartType === 'auto'
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        style={chartType === 'auto' ? { background: 'var(--navbar)' } : {}}
                        aria-label="Auto"
                    >
                        <Settings2 size={20} />
                    </button>
                    <button
                        onClick={() => setChartType('stem')}
                        className={`px-3 py-2 text-sm rounded flex items-center justify-center transition-colors ${chartType === 'stem'
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        style={chartType === 'stem' ? { background: 'var(--navbar)' } : {}}
                        aria-label="Stem"
                    >
                        <ChartNoAxesColumn size={20} />
                    </button>
                    <button
                        onClick={() => setChartType('histogram')}
                        className={`px-3 py-2 text-sm rounded flex items-center justify-center transition-colors ${chartType === 'histogram'
                            ? 'text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        style={chartType === 'histogram' ? { background: 'var(--navbar)' } : {}}
                        aria-label="Histogram"
                    >
                        <BarChart3 size={20} />
                    </button>
                    {/* Outlier toggle - only show if outliers exist */}
                    {processedData.hasOutliers && (
                        <button
                            onClick={() => setHideOutliers(!hideOutliers)}
                            className={`px-3 py-2 text-sm rounded flex items-center justify-center transition-colors ${hideOutliers
                                ? 'text-white bg-[var(--secondary)]'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            style={hideOutliers ? { background: 'var(--secondary)', color: 'white' } : {}}
                            aria-label={hideOutliers ? 'Show Outliers' : 'Hide Outliers'}
                        >
                            {hideOutliers ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}
                </div>
            </div>
            {/* Chart fills remaining space, no scrollbar */}
            <div className="flex-grow w-full" style={{ height: '100%', overflow: 'hidden', background: 'transparent' }}>
                <Plot
                    data={chartData.plotData}
                    layout={{
                        ...chartData.layout,
                        autosize: true,
                        margin: { t: 50, r: 50, b: 50, l: 50 },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    config={{
                        responsive: true,
                        displayModeBar: false,
                    }}
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                />
            </div>
        </div>
    );
};

export default StatisticsChart;