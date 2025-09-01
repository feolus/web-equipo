import React, { useState, useEffect, useMemo } from 'react';
import LineChart from './LineChart';
import type { PerformanceData } from '../types';
import { TESTS, CHART_COLORS } from '../constants';
import type { ChartData, ChartOptions } from 'chart.js';

interface ComparisonDashboardProps {
    playerNames: string[];
    sessionLabels: string[];
    performanceData: PerformanceData;
}

const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ playerNames, sessionLabels, performanceData }) => {
    const [selectedTest, setSelectedTest] = useState<string>(TESTS[0]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>(() => playerNames.slice(0, 6));

    useEffect(() => {
        // Keep selection in sync if player names change
        setSelectedPlayers(prev => prev.filter(p => playerNames.includes(p)));
    }, [playerNames]);


    const handlePlayerSelection = (player: string) => {
        setSelectedPlayers(prev => {
            if (prev.includes(player)) {
                return prev.filter(p => p !== player);
            }
            if (prev.length < 6) {
                return [...prev, player];
            }
            alert("Puedes seleccionar un máximo de 6 jugadores para comparar.");
            return prev;
        });
    };

    const chartData: ChartData<'line'> = useMemo(() => {
        return {
            labels: sessionLabels,
            datasets: selectedPlayers
                .filter(player => performanceData[player])
                .map((player, index) => ({
                    label: player,
                    data: performanceData[player]?.[selectedTest]?.map(Number) || [],
                    borderColor: CHART_COLORS[index % CHART_COLORS.length],
                    backgroundColor: 'transparent',
                    tension: 0.1,
                })),
        };
    }, [selectedPlayers, selectedTest, sessionLabels, performanceData]);

    const chartOptions: ChartOptions<'line'> = useMemo(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: `Comparativa - ${selectedTest}`, font: { size: 18 } },
            },
            scales: {
                y: {
                    title: { display: true, text: selectedTest.split('(')[1]?.replace(')', '') || 'Valor' },
                    beginAtZero: true,
                },
            },
        };
    }, [selectedTest]);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard de Comparativas</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label htmlFor="test-select-compare" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Prueba</label>
                        <select
                            id="test-select-compare"
                            value={selectedTest}
                            onChange={e => setSelectedTest(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            {TESTS.map(test => <option key={test} value={test}>{test}</option>)}
                        </select>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Jugadores (hasta 6)</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-md p-2 bg-white">
                            {playerNames.map((player) => (
                                <div key={player} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`player-check-${player}`}
                                        value={player}
                                        checked={selectedPlayers.includes(player)}
                                        onChange={() => handlePlayerSelection(player)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`player-check-${player}`} className="ml-2 block text-sm text-gray-900">{player}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-3 bg-white p-4 rounded-lg shadow-sm" style={{ height: '400px' }}>
                     {selectedPlayers.length > 0 ? (
                        <LineChart data={chartData} options={chartOptions} />
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Por favor, selecciona al menos un jugador para mostrar el gráfico.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default ComparisonDashboard;