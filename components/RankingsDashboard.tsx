
import React, { useState, useMemo, useEffect } from 'react';
import type { PerformanceData } from '../types';
import { TESTS } from '../constants';

interface RankingsDashboardProps {
    playerNames: string[];
    sessionLabels: string[];
    performanceData: PerformanceData;
}

const RankingsDashboard: React.FC<RankingsDashboardProps> = ({
    playerNames,
    sessionLabels,
    performanceData,
}) => {
    // Default to the most recent session
    const [selectedSession, setSelectedSession] = useState<string>(
        sessionLabels[sessionLabels.length - 1] || ''
    );
    
    useEffect(() => {
        // If the selected session is no longer valid (e.g., data reset) or was never set,
        // default to the most recent one.
        if ((!selectedSession || !sessionLabels.includes(selectedSession)) && sessionLabels.length > 0) {
            setSelectedSession(sessionLabels[sessionLabels.length - 1]);
        }
    }, [sessionLabels, selectedSession]);


    const rankings = useMemo(() => {
        if (!selectedSession) return {};

        const sessionIndex = sessionLabels.indexOf(selectedSession);
        if (sessionIndex === -1) return {};

        const rankingsByTest: { [testName: string]: { player: string; score: number }[] } = {};

        TESTS.forEach(test => {
            const playersWithScores = playerNames
                .map(player => ({
                    player,
                    score: parseFloat(performanceData[player]?.[test]?.[sessionIndex] || '0.0'),
                }))
                .filter(item => item.score > 0); // Exclude players with no score

            // Sorting logic based on test type
            if (test.includes('(s)')) { // Lower is better (time)
                playersWithScores.sort((a, b) => a.score - b.score);
            } else { // Higher is better (reps, meters)
                playersWithScores.sort((a, b) => b.score - a.score);
            }

            rankingsByTest[test] = playersWithScores;
        });

        return rankingsByTest;
    }, [selectedSession, playerNames, sessionLabels, performanceData]);

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Rankings por Prueba</h1>
                <div className="mt-2 sm:mt-0 w-full sm:w-auto">
                    <label htmlFor="session-select" className="block text-sm font-medium text-gray-700">
                        Seleccionar Sesión:
                    </label>
                    <select
                        id="session-select"
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {sessionLabels.map(session => (
                            <option key={session} value={session}>
                                {session}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {Object.keys(rankings).length > 0 && selectedSession ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {TESTS.map(test => (
                        <div key={test} className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">🏆 {test}</h2>
                            {rankings[test]?.length > 0 ? (
                                <ul className="space-y-2">
                                    {rankings[test].map(({ player, score }, index) => (
                                        <li key={player} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                            <div className="flex items-center">
                                                <span className="font-bold text-gray-600 w-8 text-lg">{getMedal(index)}</span>
                                                <span className="text-gray-800">{player}</span>
                                            </div>
                                            <span className="font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full text-xs sm:text-sm">
                                                {score.toFixed(1)} {test.split('(')[1]?.replace(')', '')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No hay datos para esta prueba en la sesión seleccionada.</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>No hay datos disponibles. Por favor, selecciona una sesión o añade datos en la pestaña 'Datos'.</p>
                </div>
            )}
        </div>
    );
};

export default RankingsDashboard;
