export type PerformanceData = {
    [playerName: string]: {
        [testName: string]: string[];
    };
};

// Renamed from Tab for clarity
export type PhysicalTestTab = 'datos' | 'individual' | 'comparativas' | 'rankings';

// New main navigation tabs
export type MainTab = 'login' | 'pruebas' | 'partidos' | 'entrenamientos';

// --- Types for Matches Dashboard ---

export type MatchType = 'Partido oficial' | 'Amistoso' | 'Copa';

export type SquadStatus = 'Titular' | 'Suplente' | 'No convocado' | 'Lesión' | 'Ausencia personal';

export type Goal = {
    playerId: string;
    minute?: number;
};

export type Assist = {
    playerId: string;
};

export type Match = {
    id: string;
    date: string;
    type: MatchType;
    opponent: string;
    result: string; // e.g., "2-1"
    squad: { [playerId: string]: SquadStatus };
    goals: Goal[];
    assists: Assist[];
};

export type PlayerMatchStats = {
    name: string;
    convocatorias: number;
    titularidades: number;
    suplencias: number;
    noConvocado: number;
    lesion: number;
    ausenciaPersonal: number;
    goles: number;
    asistencias: number;
};


// --- Types for Trainings Dashboard ---

export type TrainingAttendanceStatus = 'Presente' | 'Ausente' | 'Lesión' | 'Vacío';

export type TrainingData = {
    [date: string]: {
        [playerName: string]: TrainingAttendanceStatus;
    };
};

export type PlayerTrainingStats = {
    name: string;
    totalAsistencias: number;
    totalAusencias: number;
    totalLesiones: number;
    porcentajeAsistencia: number;
};