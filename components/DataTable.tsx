
import React, { useState } from 'react';
import type { PerformanceData } from '../types';
import { TESTS } from '../constants';

interface DataTableProps {
    playerNames: string[];
    sessionLabels: string[];
    performanceData: PerformanceData;
    onPlayerNameChange: (originalName: string, newName: string) => boolean;
    onDataChange: (player: string, test: string, sessionIndex: number, value: string) => void;
    onAddNewSession: (date: string) => void;
    onDeleteSession: (date: string) => void;
}

const EditableCell: React.FC<{
    initialValue: string;
    onSave: (value: string) => boolean | void;
    isNumeric?: boolean;
    className?: string;
    rowSpan?: number;
}> = ({ initialValue, onSave, isNumeric = false, className = '', rowSpan }) => {
    const handleBlur = (e: React.FocusEvent<HTMLTableCellElement>) => {
        const newValue = e.currentTarget.textContent?.trim() || '';
        if (isNumeric) {
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue)) {
                onSave(numValue.toFixed(1));
            } else {
                e.currentTarget.textContent = initialValue;
            }
        } else {
            if (!onSave(newValue)) {
                e.currentTarget.textContent = initialValue;
            }
        }
    };

    return (
        <td
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            rowSpan={rowSpan}
            className={`px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-center transition-colors hover:bg-indigo-100 focus:outline-indigo-500 focus:bg-white ${className}`}
        >
            {initialValue}
        </td>
    );
};


const DataTable: React.FC<DataTableProps> = ({
    playerNames,
    sessionLabels,
    performanceData,
    onPlayerNameChange,
    onDataChange,
    onAddNewSession,
    onDeleteSession,
}) => {
    const getTodayDate = (): string => new Date().toISOString().split('T')[0];
    const [newSessionDate, setNewSessionDate] = useState(getTodayDate());
    
    const handleAddClick = () => {
        onAddNewSession(newSessionDate);
    };

    const handleDeleteClick = (sessionLabel: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la sesión del ${sessionLabel}? Esta acción borrará todos los datos de rendimiento asociados.`)) {
            onDeleteSession(sessionLabel);
        }
    };

    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800">
                    <tr>
                        <th className="px-2 sm:px-4 py-3 text-center text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-gray-800 z-20">Jugador</th>
                        <th className="px-2 sm:px-4 py-3 text-center text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">Prueba</th>
                        {sessionLabels.map(label => (
                            <th key={label} className="px-2 sm:px-4 py-3 text-center text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider min-w-[140px]">
                                <div className="flex items-center justify-center gap-2">
                                    <span>{label}</span>
                                    <button
                                        onClick={() => handleDeleteClick(label)}
                                        className="bg-red-500 text-white rounded-full h-4 w-4 flex-shrink-0 flex items-center justify-center text-xs font-bold opacity-80 hover:opacity-100 hover:bg-red-600 transition-all"
                                        aria-label={`Eliminar sesión ${label}`}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </th>
                        ))}
                        <th className="px-2 py-3 text-center text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider sticky right-0 bg-gray-800 z-20 min-w-[200px]">
                            <div className="flex items-center justify-center gap-2">
                                <input 
                                    type="date" 
                                    value={newSessionDate}
                                    onChange={e => setNewSessionDate(e.target.value)}
                                    className="p-1 rounded-md text-gray-800 text-xs w-32"
                                />
                                <button
                                    onClick={handleAddClick}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-2 text-[11px] sm:py-2 sm:px-3 sm:text-xs rounded-md transition-colors"
                                >
                                    + Sesión
                                </button>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {playerNames.map((player, playerIndex) => (
                        <React.Fragment key={player}>
                            {TESTS.map((test, testIndex) => {
                                const isAlternateRow = playerIndex % 2 === 0;
                                const rowBg = isAlternateRow ? 'bg-gray-50' : 'bg-white';

                                return (
                                    <tr key={`${player}-${test}`} className={rowBg}>
                                        {testIndex === 0 && (
                                            <EditableCell
                                                rowSpan={TESTS.length}
                                                initialValue={player}
                                                onSave={(newName) => onPlayerNameChange(player, newName)}
                                                className={`whitespace-nowrap font-medium text-gray-900 border-r sticky left-0 z-10 align-middle ${rowBg}`}
                                            />
                                        )}

                                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 text-center">{test}</td>

                                        {sessionLabels.map((_, sessionIndex) => (
                                            <EditableCell
                                                key={`${player}-${test}-${sessionIndex}`}
                                                initialValue={performanceData[player]?.[test]?.[sessionIndex] || '0.0'}
                                                onSave={(value) => onDataChange(player, test, sessionIndex, value)}
                                                isNumeric={true}
                                                className="text-gray-500"
                                            />
                                        ))}
                                        {testIndex === 0 && (
                                           <td rowSpan={TESTS.length} className={`sticky right-0 border-l align-middle ${rowBg}`}></td>
                                        )}
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
