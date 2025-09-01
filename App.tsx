
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_PLAYER_COUNT, TESTS } from './constants';
import type { PerformanceData, MainTab, PhysicalTestTab, Match, TrainingData } from './types';
import DataTable from './components/DataTable';
import IndividualReport from './components/IndividualReport';
import ComparisonDashboard from './components/ComparisonDashboard';
import ResetModal from './components/ResetModal';
import RankingsDashboard from './components/RankingsDashboard';
import MatchesDashboard from './components/MatchesDashboard';
import TrainingsDashboard from './components/TrainingsDashboard';

// --- Google API Configuration ---
declare global {
    interface Window {
        gapi: any;
        google: any;
        tokenClient: any;
        // This object will be injected by Netlify
        GOOGLE_CREDS?: {
            API_KEY: string;
            CLIENT_ID: string;
            SPREADSHEET_ID: string;
        }
    }
}

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// --- Constants for Sheet Names ---
const SHEET_NAMES = {
    performance: 'RendimientoFisico',
    matches: 'Partidos',
    trainings: 'Entrenamientos',
};


const App: React.FC = () => {
    // --- Safe Credential Reading ---
    // Read credentials inside the component to ensure window object is populated
    const API_KEY = window.GOOGLE_CREDS?.API_KEY;
    const CLIENT_ID = window.GOOGLE_CREDS?.CLIENT_ID;
    const SPREADSHEET_ID = window.GOOGLE_CREDS?.SPREADSHEET_ID;
    const areCredsMissing = !API_KEY || !CLIENT_ID || !SPREADSHEET_ID;

    // --- App State ---
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('login');
    const [activeSubTab, setActiveSubTab] = useState<PhysicalTestTab>('datos');
    const [isResetModalOpen, setResetModalOpen] = useState(false);

    // --- Data State ---
    const [playerNames, setPlayerNames] = useState<string[]>([]);
    const [sessionLabels, setSessionLabels] = useState<string[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData>({});
    const [matches, setMatches] = useState<Match[]>([]);
    const [trainingData, setTrainingData] = useState<TrainingData>({});

    // --- Google API State ---
    const [isGapiReady, setGapiReady] = useState(false);
    const [isSignedIn, setSignedIn] = useState(false);
    const [authStatus, setAuthStatus] = useState('Por favor, inicia sesión para guardar o cargar datos.');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // --- Data Initialization ---
    const initializeOrResetData = useCallback(() => {
        const initialPlayerNames = Array.from({ length: INITIAL_PLAYER_COUNT }, (_, i) => `Jugador ${i + 1}`);
        setPlayerNames(initialPlayerNames);
        setSessionLabels([]); // Start with no sessions
        
        // Initialize empty performance data structure for players
        const data: PerformanceData = {};
        initialPlayerNames.forEach(player => {
            data[player] = {};
            TESTS.forEach(test => {
                data[player][test] = []; // Empty array for each test
            });
        });
        setPerformanceData(data);
        
        // Reset other data sets
        setMatches([]);
        setTrainingData({});

        console.log('Data has been reset to a clean state with players.');
    }, []);


    useEffect(() => {
        initializeOrResetData();
    }, [initializeOrResetData]);
    
    // --- Google API Handlers ---
    useEffect(() => {
        // Don't proceed if creds are missing
        if (areCredsMissing) {
            return;
        }

        const gapiLoaded = () => {
            window.gapi.load('client', async () => {
                await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
                setGapiReady(true);
            });
        };
        const gsiLoaded = () => {
            window.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp: any) => {
                    if (resp.error) throw resp;
                    setSignedIn(true);
                    setAuthStatus('Sesión iniciada. Ya puedes guardar o cargar datos.');
                },
            });
        };
        
        const intervalId = setInterval(() => {
            if (typeof window.gapi !== 'undefined' && typeof window.google !== 'undefined') {
                clearInterval(intervalId);
                gapiLoaded();
                gsiLoaded();
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [areCredsMissing, API_KEY, CLIENT_ID]); // Rerun if creds change

    const handleSignIn = () => {
        if (!isGapiReady || !window.tokenClient) {
            setAuthStatus('La API de Google no está lista. Por favor, espera un momento.');
            return;
        }
        window.tokenClient.requestAccessToken({ prompt: 'consent' });
    };

    const handleSignOut = () => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {
                window.gapi.client.setToken('');
                setSignedIn(false);
                setAuthStatus('Por favor, inicia sesión para guardar o cargar datos.');
            });
        }
    };

    // --- Data Persistence ---

    const saveDataToSheet = async () => {
        if (!isSignedIn || !SPREADSHEET_ID) {
            setAuthStatus('Debes iniciar sesión y tener un ID de hoja de cálculo válido.');
            return;
        }
        setIsProcessing(true);
        setAuthStatus('Guardando todos los datos...');
        try {
            // 1. Serialize all data
            const performanceValues = [['Player', 'Test', 'SessionDate', 'Value'], ...playerNames.flatMap(player => TESTS.flatMap(test => sessionLabels.map((session, idx) => [player, test, session, performanceData[player]?.[test]?.[idx] || '0.0'])))];
            const matchesValues = [['ID', 'Date', 'Type', 'Opponent', 'Result', 'SquadJSON', 'GoalsJSON', 'AssistsJSON'], ...matches.map(m => [m.id, m.date, m.type, m.opponent, m.result, JSON.stringify(m.squad), JSON.stringify(m.goals), JSON.stringify(m.assists)])];
            const trainingsValues = [['Date', 'PlayerName', 'Status'], ...Object.entries(trainingData).flatMap(([date, records]) => Object.entries(records).map(([player, status]) => [date, player, status]))];

            // 2. Clear existing data
            await window.gapi.client.sheets.spreadsheets.values.batchClear({
                spreadsheetId: SPREADSHEET_ID,
                ranges: Object.values(SHEET_NAMES),
            });
            
            // 3. Update sheets with new data
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: {
                    valueInputOption: 'USER_ENTERED',
                    data: [
                        { range: SHEET_NAMES.performance, values: performanceValues },
                        { range: SHEET_NAMES.matches, values: matchesValues },
                        { range: SHEET_NAMES.trainings, values: trainingsValues },
                    ],
                },
            });

            setAuthStatus('¡Todos los datos se han guardado con éxito!');
        } catch (err: any) {
            setAuthStatus(`Error al guardar datos: ${err.result?.error?.message || err.message}`);
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const loadDataFromSheet = async () => {
        if (!isSignedIn || !SPREADSHEET_ID) {
            setAuthStatus('Debes iniciar sesión y tener un ID de hoja de cálculo válido.');
            return;
        }
        setIsProcessing(true);
        setAuthStatus('Cargando todos los datos...');
        try {
            const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
                spreadsheetId: SPREADSHEET_ID,
                ranges: Object.values(SHEET_NAMES),
            });

            const results = response.result.valueRanges;
            if (!results) {
                setAuthStatus('No se encontraron datos. Guarda datos primero.');
                setIsProcessing(false);
                return;
            }

            // --- Performance Data Deserialization ---
            const perfRows = results.find(r => r.range.startsWith(SHEET_NAMES.performance))?.values;
            if (perfRows && perfRows.length > 1) {
                const dataMap: { [p: string]: { [t: string]: { [s: string]: string } } } = {};
                const playersSet = new Set<string>();
                const sessionsSet = new Set<string>();

                perfRows.slice(1).forEach(([player, test, session, value]) => {
                    if (!player || !test || !session) return;
                    playersSet.add(player);
                    sessionsSet.add(session);
                    if (!dataMap[player]) dataMap[player] = {};
                    if (!dataMap[player][test]) dataMap[player][test] = {};
                    dataMap[player][test][session] = value || '0.0';
                });
                
                const loadedPlayerNames = [...playersSet];
                const loadedSessionLabels = [...sessionsSet].sort();
                const finalPerfData: PerformanceData = {};
                loadedPlayerNames.forEach(p => {
                    finalPerfData[p] = {};
                    TESTS.forEach(t => {
                        finalPerfData[p][t] = loadedSessionLabels.map(s => dataMap[p]?.[t]?.[s] || '0.0');
                    });
                });
                
                setPlayerNames(loadedPlayerNames);
                setSessionLabels(loadedSessionLabels);
                setPerformanceData(finalPerfData);
            }

            // --- Matches Data Deserialization ---
            const matchRows = results.find(r => r.range.startsWith(SHEET_NAMES.matches))?.values;
            if (matchRows && matchRows.length > 1) {
                const loadedMatches: Match[] = matchRows.slice(1).map(([id, date, type, opponent, result, squad, goals, assists]) => ({
                    id, date, type, opponent, result,
                    squad: JSON.parse(squad || '{}'),
                    goals: JSON.parse(goals || '[]'),
                    assists: JSON.parse(assists || '[]'),
                }));
                setMatches(loadedMatches.sort((a,b) => b.date.localeCompare(a.date)));
            } else {
                setMatches([]);
            }

            // --- Trainings Data Deserialization ---
            const trainingRows = results.find(r => r.range.startsWith(SHEET_NAMES.trainings))?.values;
            if (trainingRows && trainingRows.length > 1) {
                const loadedTrainings: TrainingData = {};
                trainingRows.slice(1).forEach(([date, player, status]) => {
                    if (!date || !player || !status) return;
                    if (!loadedTrainings[date]) loadedTrainings[date] = {};
                    loadedTrainings[date][player] = status;
                });
                setTrainingData(loadedTrainings);
            } else {
                setTrainingData({});
            }
            
            setAuthStatus('¡Todos los datos se han cargado con éxito!');
        } catch (err: any) {
            setAuthStatus(`Error al cargar datos: ${err.result?.error?.message || err.message}`);
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };


    const handlePlayerNameChange = (originalName: string, newName: string) => {
        if (!newName || newName === originalName) return false;
        if (playerNames.includes(newName)) {
            alert('El nombre del jugador ya existe.');
            return false;
        }

        // 1. Update master list of names
        setPlayerNames(prev => prev.map(p => (p === originalName ? newName : p)));
        
        // 2. Update performance data keys
        setPerformanceData(prev => {
            const newData = { ...prev };
            if (newData[originalName]) {
                newData[newName] = newData[originalName];
                delete newData[originalName];
            }
            return newData;
        });
        
        // 3. Update match data
        setMatches(prev => prev.map(match => {
            const newSquad = { ...match.squad };
            if (newSquad[originalName]) {
                newSquad[newName] = newSquad[originalName];
                delete newSquad[originalName];
            }
            const newGoals = match.goals.map(g => g.playerId === originalName ? { ...g, playerId: newName } : g);
            const newAssists = match.assists.map(a => a.playerId === originalName ? { ...a, playerId: newName } : a);
            
            return { ...match, squad: newSquad, goals: newGoals, assists: newAssists };
        }));

        // 4. Update training data
        setTrainingData(prev => {
            const newData = { ...prev };
            Object.keys(newData).forEach(date => {
                if (newData[date][originalName]) {
                    newData[date][newName] = newData[date][originalName];
                    delete newData[date][originalName];
                }
            });
            return newData;
        });

        return true;
    };

    const handleDataChange = (player: string, test: string, sessionIndex: number, value: string) => {
        setPerformanceData(prev => {
            const newData = { ...prev };
            newData[player] = { ...newData[player] };
            const testData = [...(newData[player][test] || [])];
            testData[sessionIndex] = value;
            newData[player][test] = testData;
            return newData;
        });
    };

    const handleAddNewSession = (newSessionDate: string) => {
        if (!newSessionDate) {
            alert("Por favor, selecciona una fecha válida.");
            return;
        }
        if (sessionLabels.includes(newSessionDate)) {
            alert("La fecha de la sesión ya existe.");
            return;
        }

        const newLabels = [...sessionLabels, newSessionDate].sort();
        const sessionIndexToAdd = newLabels.indexOf(newSessionDate);

        setSessionLabels(newLabels);
        setPerformanceData(prev => {
            const newData = { ...prev };
            Object.keys(newData).forEach(player => {
                TESTS.forEach(test => {
                    const testData = [...(newData[player][test] || [])];
                    testData.splice(sessionIndexToAdd, 0, '0.0');
                    newData[player][test] = testData;
                });
            });
            return newData;
        });
    };

    const handleDeleteSession = (sessionToDelete: string) => {
        const sessionIndexToDelete = sessionLabels.indexOf(sessionToDelete);
        if (sessionIndexToDelete === -1) return;

        // Remove label
        setSessionLabels(prev => prev.filter(label => label !== sessionToDelete));

        // Remove data for that session
        setPerformanceData(prev => {
            const newData = { ...prev };
            Object.keys(newData).forEach(player => {
                Object.keys(newData[player]).forEach(test => {
                    const testData = [...(newData[player][test] || [])];
                    if (testData.length > sessionIndexToDelete) {
                        testData.splice(sessionIndexToDelete, 1);
                        newData[player][test] = testData;
                    }
                });
            });
            return newData;
        });
    };

    const confirmReset = () => {
        initializeOrResetData();
        setResetModalOpen(false);
    };

    const mainTabs: { id: MainTab, label: string, icon: string }[] = [
        { id: 'login', label: 'Inicio de Sesión', icon: '🔑' },
        { id: 'pruebas', label: 'Rendimiento Físico', icon: '🏋️' },
        { id: 'partidos', label: 'Partidos', icon: '⚽' },
        { id: 'entrenamientos', label: 'Entrenamientos', icon: '👟' },
    ];

    const physicalTestTabs: { id: PhysicalTestTab, label: string, icon: string }[] = [
        { id: 'datos', label: 'Datos', icon: '📋' },
        { id: 'individual', label: 'Informe Individual', icon: '🏃‍♂️' },
        { id: 'comparativas', label: 'Comparativas', icon: '📊' },
        { id: 'rankings', label: 'Rankings', icon: '📈' },
    ];
    
    const authStatusColor = isSignedIn 
        ? 'bg-green-100 text-green-800' 
        : authStatus.startsWith('Error') 
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

    // --- Main Render Logic ---

    // Render a clear error message if configuration is missing
    if (areCredsMissing) {
        return (
            <div className="p-4 sm:p-8">
                <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl shadow-lg p-8 text-center">
                    <h1 className="text-3xl font-bold text-red-800">❌ Error de Configuración</h1>
                    <p className="mt-4 text-lg text-red-700">
                        La aplicación no puede iniciarse porque faltan las credenciales de la API de Google.
                    </p>
                    <div className="mt-6 text-left bg-red-100 p-4 rounded-md">
                        <p className="font-semibold text-red-900">Por favor, revisa los siguientes puntos en tu configuración de Netlify:</p>
                        <ul className="list-disc list-inside mt-2 text-red-800 space-y-1">
                            <li>Ve a <strong>Site configuration &gt; Build & deploy &gt; Environment</strong>.</li>
                            <li>Asegúrate de que las siguientes <strong>variables de entorno</strong> existan y tengan un valor:
                                <ul className="list-['✓'] list-inside ml-6 font-mono bg-white p-2 my-2 rounded">
                                    <li>API_KEY</li>
                                    <li>CLIENT_ID</li>
                                    <li>SPREADSHEET_ID</li>
                                </ul>
                            </li>
                             <li>Ve a <strong>Site configuration &gt; Build & deploy &gt; Post processing &gt; Snippet injection</strong> y verifica que el script de inyección de snippets esté configurado correctamente.</li>
                            <li>Después de hacer cambios, recuerda hacer un **"Trigger deploy"** para que se apliquen.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="overflow-x-auto">
                        <nav className="-mb-px flex justify-around sm:justify-start sm:space-x-6 sm:px-6" aria-label="Main Tabs">
                            {mainTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveMainTab(tab.id)}
                                    className={`flex items-center justify-center whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                                        activeMainTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                    aria-label={tab.label}
                                >
                                    <span className="sm:hidden">{tab.icon}</span>
                                    <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {activeMainTab === 'login' && (
                    <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
                        <div className="max-w-md w-full text-center bg-gray-50 p-8 rounded-xl shadow-md">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">🔑 Gestión de Datos</h1>
                            <p className="text-gray-600 mb-6">Inicia sesión con tu cuenta de Google para guardar y cargar los datos de la aplicación en una hoja de cálculo.</p>
                            
                            <div className={`mb-6 p-4 rounded-lg transition-colors text-sm font-medium ${authStatusColor}`}>
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {authStatus}
                                    </div>
                                ) : (
                                    authStatus
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {!isSignedIn ? (
                                    <button onClick={handleSignIn} disabled={!isGapiReady || isProcessing} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base">
                                        Iniciar sesión con Google
                                    </button>
                                ) : (
                                    <button onClick={handleSignOut} disabled={isProcessing} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base">
                                        Cerrar Sesión
                                    </button>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={saveDataToSheet} disabled={!isSignedIn || isProcessing} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Guardar en Sheets</button>
                                    <button onClick={loadDataFromSheet} disabled={!isSignedIn || isProcessing} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cargar desde Sheets</button>
                                </div>
                            </div>
                            
                            <div className="mt-8 border-t pt-6">
                                <p className="text-sm text-gray-500 mb-3">Si deseas empezar de cero, puedes resetear todos los datos locales de la aplicación.</p>
                                <button onClick={() => setResetModalOpen(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                    Resetear Datos Locales
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {activeMainTab === 'pruebas' && (
                    <>
                        <div className="border-b border-gray-200 bg-gray-50">
                             <div className="overflow-x-auto">
                                 <nav className="-mb-px flex space-x-2 sm:space-x-6 px-2 sm:px-6" aria-label="Sub Tabs">
                                    {physicalTestTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveSubTab(tab.id)}
                                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                                activeSubTab === tab.id
                                                    ? 'border-indigo-500 text-indigo-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                                            }`}
                                        >
                                            <span className="sm:hidden">{tab.icon}</span>
                                            <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            {activeSubTab === 'datos' && (
                                <div>
                                     <div className="mb-4">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📋 Hoja de Datos de Rendimiento Físico</h1>
                                        <p className="text-gray-600 mt-1">Edita los nombres de los jugadores y sus resultados en las pruebas. Para sincronizar los datos, ve a la pestaña 'Inicio de Sesión'.</p>
                                    </div>
                                    <DataTable
                                        playerNames={playerNames}
                                        sessionLabels={sessionLabels}
                                        performanceData={performanceData}
                                        onPlayerNameChange={handlePlayerNameChange}
                                        onDataChange={handleDataChange}
                                        onAddNewSession={handleAddNewSession}
                                        onDeleteSession={handleDeleteSession}
                                    />
                                </div>
                            )}
                            {activeSubTab === 'individual' && (
                                 <IndividualReport
                                    playerNames={playerNames}
                                    sessionLabels={sessionLabels}
                                    performanceData={performanceData}
                                />
                            )}
                            {activeSubTab === 'comparativas' && (
                                <ComparisonDashboard
                                    playerNames={playerNames}
                                    sessionLabels={sessionLabels}
                                    performanceData={performanceData}
                                />
                            )}
                            {activeSubTab === 'rankings' && (
                                <RankingsDashboard
                                    playerNames={playerNames}
                                    sessionLabels={sessionLabels}
                                    performanceData={performanceData}
                                />
                            )}
                        </div>
                    </>
                )}
                {activeMainTab === 'partidos' && (
                     <div className="p-4 sm:p-6">
                        <MatchesDashboard 
                            playerNames={playerNames} 
                            matches={matches}
                            setMatches={setMatches}
                        />
                     </div>
                )}
                {activeMainTab === 'entrenamientos' && (
                     <div className="p-4 sm:p-6">
                        <TrainingsDashboard 
                            playerNames={playerNames} 
                            trainingData={trainingData}
                            setTrainingData={setTrainingData}
                        />
                     </div>
                )}
            </div>

            <ResetModal
                isOpen={isResetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={confirmReset}
            />
        </div>
    );
};

export default App;
