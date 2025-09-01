
import React, { useState, useMemo, useEffect } from 'react';
import type { Match, MatchType, SquadStatus, PlayerMatchStats, Goal, Assist } from '../types';

// --- Helper Functions & Constants ---
const SQUAD_STATUSES: SquadStatus[] = ['Titular', 'Suplente', 'No convocado', 'Lesión', 'Ausencia personal'];
const MATCH_TYPES: MatchType[] = ['Partido oficial', 'Amistoso', 'Copa'];
const getTodayDate = (): string => new Date().toISOString().split('T')[0];

// --- Sub-components (within the same file for simplicity) ---

// Modal to Add/Edit a Match
const AddMatchModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (match: Match) => void;
    playerNames: string[];
}> = ({ isOpen, onClose, onSave, playerNames }) => {
    const [date, setDate] = useState(getTodayDate());
    const [opponent, setOpponent] = useState('');
    const [result, setResult] = useState('');
    const [type, setType] = useState<MatchType>('Partido oficial');
    const [squad, setSquad] = useState<{ [key: string]: SquadStatus }>(() =>
        Object.fromEntries(playerNames.map(p => [p, 'No convocado']))
    );
    const [goals, setGoals] = useState<Goal[]>([]);
    const [assists, setAssists] = useState<Assist[]>([]);
    const [scorerToAdd, setScorerToAdd] = useState<string>('');
    const [assistantToAdd, setAssistantToAdd] = useState<string>('');

    // Effect to reset form state when modal opens and pre-select players for dropdowns
    useEffect(() => {
        if (isOpen) {
            setDate(getTodayDate());
            setOpponent('');
            setResult('');
            setType('Partido oficial');
            setSquad(Object.fromEntries(playerNames.map(p => [p, 'No convocado'])));
            setGoals([]);
            setAssists([]);
            if (playerNames.length > 0) {
                setScorerToAdd(playerNames[0]);
                setAssistantToAdd(playerNames[0]);
            } else {
                setScorerToAdd('');
                setAssistantToAdd('');
            }
        }
    }, [isOpen, playerNames]);


    const handleSave = () => {
        if (!opponent || !result) {
            alert('Por favor, completa los campos de Rival y Resultado.');
            return;
        }
        onSave({
            id: Date.now().toString(),
            date, opponent, result, type, squad, goals, assists,
        });
        onClose();
    };
    
    const handleAddGoal = () => {
        if (scorerToAdd) {
            setGoals(prev => [...prev, { playerId: scorerToAdd }]);
        }
    };

    const handleAddAssist = () => {
        if (assistantToAdd) {
            setAssists(prev => [...prev, { playerId: assistantToAdd }]);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Añadir Nuevo Partido</h3>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
                        <input placeholder="Rival" value={opponent} onChange={e => setOpponent(e.target.value)} className="form-input" />
                        <input placeholder="Resultado (e.g. 2-1)" value={result} onChange={e => setResult(e.target.value)} className="form-input" />
                        <select value={type} onChange={e => setType(e.target.value as MatchType)} className="form-select">
                            {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Squad, Goals, Assists */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Squad */}
                        <div className="lg:col-span-1">
                             <h4 className="font-semibold text-gray-700">Convocatoria</h4>
                             <div className="mt-2 max-h-96 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                    {playerNames.map(player => (
                                        <div key={player}>
                                            <label htmlFor={`squad-${player}`} className="block text-sm font-medium text-gray-700 truncate">{player}</label>
                                            <select 
                                                id={`squad-${player}`}
                                                value={squad[player]} 
                                                onChange={e => setSquad(s => ({...s, [player]: e.target.value as SquadStatus}))} 
                                                className="form-select form-select-sm mt-1 w-full"
                                            >
                                                {SQUAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Goals & Assists */}
                        <div className="lg:col-span-2 space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Goleadores</h4>
                                    <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                                        {goals.length === 0 && <p className="text-xs text-gray-500 text-center">Añade goleadores abajo.</p>}
                                        {goals.map((g, i) => (
                                            <div key={`${g.playerId}-${i}`} className="flex items-center justify-between gap-2 bg-white p-1 rounded">
                                                <span className="text-sm">{g.playerId}</span>
                                                <button onClick={() => setGoals(gs => gs.filter((_, idx) => idx !== i))} className="text-red-500 font-bold hover:text-red-700 text-lg leading-none p-1 rounded-full flex items-center justify-center h-5 w-5">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-stretch gap-2">
                                        <select value={scorerToAdd} onChange={e => setScorerToAdd(e.target.value)} className="form-select flex-grow" aria-label="Seleccionar goleador">
                                            {playerNames.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <button onClick={handleAddGoal} disabled={!scorerToAdd} className="btn btn-sm btn-outline disabled:opacity-50">Añadir</button>
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Asistentes</h4>
                                    <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto pr-2 border rounded-md p-2 bg-gray-50">
                                         {assists.length === 0 && <p className="text-xs text-gray-500 text-center">Añade asistentes abajo.</p>}
                                        {assists.map((a, i) => (
                                            <div key={`${a.playerId}-${i}`} className="flex items-center justify-between gap-2 bg-white p-1 rounded">
                                                <span className="text-sm">{a.playerId}</span>
                                                <button onClick={() => setAssists(as => as.filter((_, idx) => idx !== i))} className="text-red-500 font-bold hover:text-red-700 text-lg leading-none p-1 rounded-full flex items-center justify-center h-5 w-5">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-stretch gap-2">
                                        <select value={assistantToAdd} onChange={e => setAssistantToAdd(e.target.value)} className="form-select flex-grow" aria-label="Seleccionar asistente">
                                            {playerNames.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <button onClick={handleAddAssist} disabled={!assistantToAdd} className="btn btn-sm btn-outline disabled:opacity-50">Añadir</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end space-x-4 p-4 bg-gray-50 border-t">
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary">Guardar Partido</button>
                </div>
                <style>{`.form-input, .form-select { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; } .form-select-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem;} .btn { padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.2s;} .btn-primary { background-color: #4f46e5; color: white; } .btn-primary:hover { background-color: #4338ca; } .btn-secondary { background-color: #e5e7eb; color: #374151; } .btn-secondary:hover { background-color: #d1d5db; } .btn-outline { border: 1px solid #4f46e5; color: #4f46e5; } .btn-outline:hover { background-color: #e0e7ff; } .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem;}`}</style>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

interface MatchesDashboardProps {
    playerNames: string[];
    matches: Match[];
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

const MatchesDashboard: React.FC<MatchesDashboardProps> = ({ playerNames, matches, setMatches }) => {
    const [activeSection, setActiveSection] = useState<'gestion' | 'seguimiento' | 'rankings'>('gestion');
    const [isModalOpen, setModalOpen] = useState(false);

    const handleSaveMatch = (match: Match) => {
        setMatches(prev => [...prev, match].sort((a,b) => b.date.localeCompare(a.date)));
    };
    
    const playerStats = useMemo<PlayerMatchStats[]>(() => {
        const stats: { [name: string]: PlayerMatchStats } = {};
        playerNames.forEach(name => {
            stats[name] = { name, convocatorias: 0, titularidades: 0, suplencias: 0, noConvocado: 0, lesion: 0, ausenciaPersonal: 0, goles: 0, asistencias: 0 };
        });

        matches.forEach(match => {
            Object.entries(match.squad).forEach(([playerName, status]) => {
                if (stats[playerName]) {
                    if (status === 'Titular') { stats[playerName].titularidades++; stats[playerName].convocatorias++; }
                    else if (status === 'Suplente') { stats[playerName].suplencias++; stats[playerName].convocatorias++; }
                    else if (status === 'No convocado') { stats[playerName].noConvocado++; }
                    else if (status === 'Lesión') { stats[playerName].lesion++; }
                    else if (status === 'Ausencia personal') { stats[playerName].ausenciaPersonal++; }
                }
            });
            match.goals.forEach(goal => {
                if(stats[goal.playerId]) stats[goal.playerId].goles++;
            });
            match.assists.forEach(assist => {
                 if(stats[assist.playerId]) stats[assist.playerId].asistencias++;
            });
        });

        return Object.values(stats);
    }, [matches, playerNames]);

    const goalRankings = useMemo(() => playerStats.filter(p => p.goles > 0).sort((a, b) => b.goles - a.goles), [playerStats]);
    const assistRankings = useMemo(() => playerStats.filter(p => p.asistencias > 0).sort((a, b) => b.asistencias - a.asistencias), [playerStats]);

    const sections = [
        { id: 'gestion', label: '📋 Gestión de Partidos' },
        { id: 'seguimiento', label: '📊 Seguimiento de Jugadores' },
        { id: 'rankings', label: '🏆 Rankings' },
    ];

    return (
        <div>
             <AddMatchModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveMatch} playerNames={playerNames} />
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSection(sec.id as any)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeSection === sec.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{sec.label}</button>
                    ))}
                </nav>
            </div>

            {activeSection === 'gestion' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Historial de Partidos</h2>
                        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Añadir Partido</button>
                    </div>
                     {matches.length === 0 ? <p className="text-gray-500 text-center py-8">No hay partidos registrados. ¡Añade el primero!</p> : (
                        <div className="space-y-4">
                            {matches.map(m => (
                                <div key={m.id} className="bg-gray-50 p-4 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-lg text-gray-800">{m.opponent}</span>
                                            <span className={`text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${m.type === 'Partido oficial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200'}`}>{m.type}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-xl font-bold text-indigo-600">{m.result}</p>
                                            <p className="text-sm text-gray-500">{m.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}

            {activeSection === 'seguimiento' && (
                 <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Estadísticas por Jugador</h2>
                    <div className="overflow-x-auto shadow-md sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-800 text-white"><tr>
                                {['Jugador', 'Conv.', 'Titular', 'Supl.', 'No Conv.', 'Lesión', 'Ausencia', 'Goles', 'Asist.'].map(h => <th key={h} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">{h}</th>)}
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {playerStats.map(p => <tr key={p.name} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                                    <td className="px-4 py-3 text-center">{p.convocatorias}</td><td className="px-4 py-3 text-center">{p.titularidades}</td>
                                    <td className="px-4 py-3 text-center">{p.suplencias}</td><td className="px-4 py-3 text-center">{p.noConvocado}</td>
                                    <td className="px-4 py-3 text-center">{p.lesion}</td><td className="px-4 py-3 text-center">{p.ausenciaPersonal}</td>
                                    <td className="px-4 py-3 text-center font-bold text-indigo-600">{p.goles}</td><td className="px-4 py-3 text-center font-bold text-green-600">{p.asistencias}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSection === 'rankings' && (
                 <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Rankings del Equipo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                           <h3 className="text-lg font-bold text-gray-700 mb-3">⚽ Goleadores</h3>
                           {goalRankings.length === 0 ? <p className="text-gray-500">Sin datos</p> : <ul>{goalRankings.map((p, i) => <li key={p.name} className="flex justify-between items-center py-1.5"><span>{i+1}. {p.name}</span><span className="font-bold text-indigo-600">{p.goles}</span></li>)}</ul>}
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                           <h3 className="text-lg font-bold text-gray-700 mb-3">👟 Asistentes</h3>
                           {assistRankings.length === 0 ? <p className="text-gray-500">Sin datos</p> : <ul>{assistRankings.map((p, i) => <li key={p.name} className="flex justify-between items-center py-1.5"><span>{i+1}. {p.name}</span><span className="font-bold text-green-600">{p.asistencias}</span></li>)}</ul>}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MatchesDashboard;
