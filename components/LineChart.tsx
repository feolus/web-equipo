
import React, { useEffect, useRef } from 'react';
import type { Chart, ChartData, ChartOptions } from 'chart.js';

interface LineChartProps {
    data: ChartData<'line'>;
    options: ChartOptions<'line'>;
}

const LineChart: React.FC<LineChartProps> = ({ data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart<'line'> | null>(null);

    useEffect(() => {
        // Ensure Chart.js is available from the CDN
        const ChartJs = (window as any).Chart;
        if (!ChartJs) {
            console.error("Chart.js has not been loaded from the CDN yet.");
            return;
        }

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Destroy previous chart instance if it exists
                if (chartRef.current) {
                    chartRef.current.destroy();
                }
                
                chartRef.current = new ChartJs(ctx, {
                    type: 'line',
                    data: data,
                    options: options,
                });
            }
        }

        // Cleanup function to destroy chart on component unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [data, options]);

    return <canvas ref={canvasRef}></canvas>;
};

export default LineChart;
