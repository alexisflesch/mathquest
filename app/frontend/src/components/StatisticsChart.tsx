import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BarChart3, Activity, RotateCcw, EyeOff, Eye } from 'lucide-react';

interface StatisticsChartProps {
    data: number[];
}

type ChartType = 'auto' | 'stem' | 'histogram';

const StatisticsChart: React.FC<StatisticsChartProps> = ({ data }) => {
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
            // Stem plot - frequency for each unique value
            const frequencies = uniqueValues.map(value =>
                values.filter(v => v === value).length
            );

            return {
                type: 'stem',
                plotData: [{
                    x: uniqueValues,
                    y: frequencies,
                    type: 'scatter',
                    mode: 'markers+lines',
                    line: { shape: 'hv', width: 0 },
                    marker: {
                        size: 8,
                        symbol: 'line-ns-open',
                        line: { width: 2 }
                    },
                    name: 'Frequency'
                }] as any,
                layout: {
                    title: { text: 'Stem Plot' },
                    xaxis: {
                        title: { text: 'Values' },
                        tickmode: 'array',
                        tickvals: uniqueValues,
                        ticktext: uniqueValues.map(v => v.toString())
                    },
                    yaxis: {
                        title: { text: 'Frequency' },
                        rangemode: 'tozero'
                    }
                }
            };
        } else {
            // Histogram
            return {
                type: 'histogram',
                plotData: [{
                    x: values,
                    type: 'histogram',
                    nbinsx: Math.min(Math.ceil(Math.sqrt(values.length)), 50),
                    name: 'Frequency'
                }] as any,
                layout: {
                    title: { text: 'Histogram' },
                    xaxis: { title: { text: 'Values' } },
                    yaxis: {
                        title: { text: 'Frequency' },
                        rangemode: 'tozero'
                    }
                }
            };
        }
    }, [processedData, chartType]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data to display</p>
            </div>
        );
    }

    if (!chartData) return null;

    return (
        <div className="w-full space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 border rounded-lg p-1">
                    <button
                        onClick={() => setChartType('auto')}
                        className={`px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${chartType === 'auto'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <RotateCcw size={16} />
                        Auto
                    </button>
                    <button
                        onClick={() => setChartType('stem')}
                        className={`px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${chartType === 'stem'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Activity size={16} />
                        Stem
                    </button>
                    <button
                        onClick={() => setChartType('histogram')}
                        className={`px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${chartType === 'histogram'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <BarChart3 size={16} />
                        Histogram
                    </button>
                </div>

                {/* Outlier toggle - only show if outliers exist */}
                {processedData.hasOutliers && (
                    <button
                        onClick={() => setHideOutliers(!hideOutliers)}
                        className={`px-3 py-2 text-sm rounded flex items-center gap-2 border transition-colors ${hideOutliers
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                            }`}
                    >
                        {hideOutliers ? <EyeOff size={16} /> : <Eye size={16} />}
                        {hideOutliers ? 'Show' : 'Hide'} Outliers
                        <span className="text-xs opacity-75">
                            ({processedData.outlierIndices.length})
                        </span>
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="text-sm text-gray-600">
                Showing {processedData.values.length} values
                {processedData.hasOutliers && hideOutliers &&
                    ` (${processedData.outlierIndices.length} outliers hidden)`
                }
            </div>

            {/* Chart */}
            <div className="w-full">
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
                    style={{ width: '100%', height: '400px' }}
                />
            </div>
        </div>
    );
};

export default StatisticsChart;