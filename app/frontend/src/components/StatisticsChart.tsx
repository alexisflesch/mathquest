import React, { useState, Suspense } from 'react';
import { BarChart3 } from 'lucide-react';

interface StatisticsChartProps {
    data: number[];
    layout?: 'top' | 'left'; // New prop for button layout
}

// Lazy load the actual StatisticsChart component
const LazyStatisticsChart = React.lazy(() => import('./StatisticsChartImpl'));

const StatisticsChart: React.FC<StatisticsChartProps> = (props) => {
    const [isLoaded, setIsLoaded] = useState(false);

    // Load the component when first needed
    React.useEffect(() => {
        if (!isLoaded) {
            setIsLoaded(true);
        }
    }, [isLoaded]);

    if (!isLoaded) {
        // Show a simple loading placeholder
        return (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500">
                    <BarChart3 className="w-5 h-5" />
                    <span>Loading chart...</span>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-500">
                    <BarChart3 className="w-5 h-5 animate-spin" />
                    <span>Loading chart...</span>
                </div>
            </div>
        }>
            <LazyStatisticsChart {...props} />
        </Suspense>
    );
};

export default StatisticsChart;
