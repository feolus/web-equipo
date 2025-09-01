
import React, { useState, useMemo } from 'react';
import type { TrainingData, TrainingAttendanceStatus, PlayerTrainingStats } from '../types';

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const STATUS_CYCLE: TrainingAttendanceStatus[] = ['Presente', 'Ausente', 'Lesión', 'Vacío'];
const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
};

// --- Sub-components ---

const AttendanceIcon: React.FC<{ status: TrainingAttendanceStatus | undefined }> = ({ status }) => {
    const baseClasses = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-lg transition-colors";
    
    switch (status) {
        case 'Presente':
            return <div className={`${baseClasses} bg-green-100 text-green-700`} title="Presente">✓</div>;
        case 'Ausente':
            return <div className={`${baseClasses} bg-red-100 text-red-700`} title="Ausente">×</div>;
        case 'Lesión':
            return <div className={`${baseClasses} bg-yellow-100 text-yellow-800`} title="Lesión">+</div>;
        case 'Vacío':
        default:
            return <div className={`${baseClasses} bg-gray-100 text-gray-400`} title="Vacío">-</div>;
    }
};

const PercentageBar: React.FC<{ percentage: number }> = ({ percentage }) => {
    const bgColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="w-24 bg-gray-200 rounded-full h-5 relative overflow-hidden">
            <div
                className={`h-full rounded-full ${bgColor} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                {percentage.toFixed(0)}%
            </span>
        </div>
    );
};

interface TrainingsDashboardProps {
    playerNames: string[];
    trainingData: TrainingData;
    setTrainingData: React.Dispatch<React.SetStateAction<TrainingData>>;
}

const TrainingsDashboard: React.FC<TrainingsDashboardProps> = ({ playerNames, trainingData, setTrainingData }) => {
    const [newSessionDate, setNewSessionDate] = useState(getTodayDate());

    // Memoized Calculations
    const sessionDates = useMemo(() => Object.keys(trainingData).sort(), [trainingData]);

    const playerStats = useMemo<PlayerTrainingStats[]>(() => {
        return playerNames.map(name => {
            let totalAsistencias = 0;
            let totalAusencias = 0;
            let totalLesiones = 0;

            sessionDates.forEach(date => {
                const status = trainingData[date]?.[name];
                if (status === 'Presente') totalAsistencias++;
                else if (status === 'Ausente') totalAusencias++;
                else if (status === 'Lesión') totalLesiones++;
            });

            const relevantSessions = sessionDates.filter(date => trainingData[date]?.[name] && trainingData[date][name] !== 'Vacío').length;
            const percentage = relevantSessions > 0 ? (totalAsistencias / relevantSessions) * 100 : 0;
            
            return { name, totalAsistencias, totalAusencias, totalLesiones, porcentajeAsistencia: percentage };
        });
    }, [playerNames, trainingData, sessionDates]);

    // Handlers
    const handleAddNewSession = () => {
        if (!newSessionDate) {
            alert("Por favor, selecciona una fecha.");
            return;
        }
        if (trainingData[newSessionDate]) {
            alert("La fecha de entrenamiento ya existe.");
            return;
        }
        setTrainingData(prev => ({
            ...prev,
            [newSessionDate]: Object.fromEntries(playerNames.map(p => [p, 'Presente'])),
        }));
    };

    const handleStatusChange = (player: string, date: string) => {
        const currentStatus = trainingData[date]?.[player] || 'Vacío';
        const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
        const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
        
        setTrainingData(prev => ({
            ...prev,
            [date]: { ...prev[date], [player]: nextStatus },
        }));
    };

    const handleDeleteSession = (dateToDelete: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la sesión de entrenamiento del ${formatDate(dateToDelete)}? Esta acción no se puede deshacer.`)) {
            setTrainingData(prev => {
                const newData = { ...prev };
                delete newData[dateToDelete];
                return newData;
            });
        }
    };


    // Render
    return (
        <div className="p-0 sm:p-2">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
                <label htmlFor="training-date" className="font-medium text-gray-700 whitespace-nowrap">Fecha de Entrenamiento</label>
                <div className="flex items-center gap-2">
                    <input
                        id="training-date"
                        type="date"
                        value={newSessionDate}
                        onChange={(e) => setNewSessionDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button onClick={handleAddNewSession} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors shadow-sm">
                        + Añadir Entrenamiento
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto shadow-lg sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">Nombre del Jugador</th>
                            {sessionDates.map(date => (
                                <th key={date} className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-1">
                                        <span>{formatDate(date)}</span>
                                        <button
                                            onClick={() => handleDeleteSession(date)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-0.5 rounded-full hover:bg-red-100"
                                            aria-label={`Eliminar sesión del ${formatDate(date)}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Asistencias</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Ausencias</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Lesiones</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">% Asistencia</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {playerNames.length === 0 ? (
                            <tr><td colSpan={sessionDates.length + 5} className="text-center py-10 text-gray-500">No hay jugadores para mostrar.</td></tr>
                        ) : playerStats.map(p => (
                            <tr key={p.name} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50/50 z-10 border-r">{p.name}</td>
                                {sessionDates.map(date => (
                                    <td key={`${p.name}-${date}`} className="px-2 py-1 text-center">
                                        <button
                                            onClick={() => handleStatusChange(p.name, date)}
                                            className="w-full h-full flex items-center justify-center rounded-md hover:bg-gray-200/50 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            aria-label={`Cambiar asistencia para ${p.name} en ${formatDate(date)}`}
                                        >
                                            <AttendanceIcon status={trainingData[date]?.[p.name]} />
                                        </button>
                                    </td>
                                ))}
                                <td className="py-2 text-center font-semibold text-green-600 text-lg">{p.totalAsistencias}</td>
                                <td className="py-2 text-center font-semibold text-red-600 text-lg">{p.totalAusencias}</td>
                                <td className="py-2 text-center font-semibold text-yellow-600 text-lg">{p.totalLesiones}</td>
                                <td className="py-2 text-center">
                                    <div className="flex justify-center">
                                        <PercentageBar percentage={p.porcentajeAsistencia} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-center text-xs text-gray-500 mt-6">
                Creado para replicar la funcionalidad de una hoja de cálculo de asistencia dinámica. <br />
                Haz clic en los iconos de asistencia para cambiar el estado (Presente → Ausente → Lesión → Vacío).
            </p>
        </div>
    );
};

export default TrainingsDashboard;
