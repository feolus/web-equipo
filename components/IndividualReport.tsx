import React, { useState, useEffect, useMemo } from 'react';
import LineChart from './LineChart';
import type { PerformanceData } from '../types';
import { TESTS, CHART_COLORS } from '../constants';
import type { ChartData, ChartOptions } from 'chart.js';

interface IndividualReportProps {
    playerNames: string[];
    sessionLabels: string[];
    performanceData: PerformanceData;
}

const IndividualReport: React.FC<IndividualReportProps> = ({ playerNames, sessionLabels, performanceData }) => {
    const [selectedPlayer, setSelectedPlayer] = useState<string>(playerNames[0] || '');

    useEffect(() => {
        if (!playerNames.includes(selectedPlayer) && playerNames.length > 0) {
            setSelectedPlayer(playerNames[0]);
        }
    }, [playerNames, selectedPlayer]);

    const teamAverages = useMemo(() => {
        const averages: { [testName: string]: number[] } = {};
        TESTS.forEach(test => {
            averages[test] = sessionLabels.map((_, sessionIndex) => {
                const playerCount = playerNames.length;
                if (playerCount === 0) return 0;
                
                let total = 0;
                playerNames.forEach(player => {
                    const value = parseFloat(performanceData[player]?.[test]?.[sessionIndex] || '0.0');
                    total += !isNaN(value) ? value : 0;
                });
                return total / playerCount;
            });
        });
        return averages;
    }, [playerNames, sessionLabels, performanceData]);

    const getChartData = (test: string, color: string): ChartData<'line'> => {
        const playerData = performanceData[selectedPlayer]?.[test]?.map(Number) || [];
        const averageData = teamAverages[test] || [];
        return {
            labels: sessionLabels,
            datasets: [{
                label: selectedPlayer,
                data: playerData,
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: true,
                tension: 0.1,
            }, {
                label: 'Media del Equipo',
                data: averageData,
                borderColor: '#6b7280', // gray-500
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.1,
                borderDash: [5, 5],
                pointRadius: 2,
            }],
        };
    };

    const getChartOptions = (test: string): ChartOptions<'line'> => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: `Evolución - ${test}`, font: { size: 16 } },
                legend: { display: true, position: 'top' },
            },
            scales: {
                y: {
                    title: { display: true, text: test.split('(')[1]?.replace(')', '') || 'Valor' },
                    beginAtZero: true,
                },
            },
        };
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Informe de Evolución Individual</h1>
                <div className="mt-2 sm:mt-0 w-full sm:w-auto">
                    <label htmlFor="player-select" className="block text-sm font-medium text-gray-700">Seleccionar Jugador:</label>
                    <select
                        id="player-select"
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {playerNames.map(player => (
                            <option key={player} value={player}>{player}</option>
                        ))}
                    </select>
                </div>
            </div>
            {playerNames.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {TESTS.map((test, index) => (
                        <div key={test} className="bg-white p-4 rounded-lg shadow-sm" style={{ height: '300px' }}>
                            <LineChart
                                data={getChartData(test, CHART_COLORS[index % CHART_COLORS.length])}
                                options={getChartOptions(test)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>No hay datos de jugadores disponibles. Por favor, añade datos en la pestaña 'Datos'.</p>
                </div>
            )}
        </div>
    );
};

export default IndividualReport;