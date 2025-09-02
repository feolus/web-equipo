
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Type Definitions ---
declare global {
    interface Window {
        gapi: any;
        google: any;
        GOOGLE_CREDS?: {
            API_KEY: string;
            CLIENT_ID: string;
            SPREADSHEET_ID: string;
        }
    }
}

export interface InitializedProps {
    gapi: any;
    tokenClient: any;
    creds: NonNullable<Window['GOOGLE_CREDS']>;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

// --- Bootstrap Function: The core of the solution ---
async function bootstrap() {
    // Show a loading indicator immediately
    root.render(<LoadingIndicator />);
    
    try {
        // --- 1. Wait for all dependencies to be ready ---
        const creds = await waitForCreds();
        // The scripts are loaded in parallel via index.html's async/defer.
        // We just wait for their 'onload' signals.
        await Promise.all([waitForGapi(), waitForGsi()]);

        // --- 2. Initialize Google Clients ---
        await new Promise<void>((resolve, reject) => window.gapi.load('client', {
            callback: resolve,
            onerror: reject,
            timeout: 5000,
            ontimeout: () => reject(new Error('gapi.client.load timed out.'))
        }));
        
        await window.gapi.client.init({
            apiKey: creds.API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: creds.CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: () => {}, // Callback is handled inside the App component dynamically
        });

        // --- 3. Render the main application ---
        root.render(
            <React.StrictMode>
                <App gapi={window.gapi} tokenClient={tokenClient} creds={creds} />
            </React.StrictMode>
        );

    } catch (error) {
        // --- 4. Render a detailed error screen on failure ---
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Application bootstrap failed:", error);
        root.render(<BootstrapError message={errorMessage} />);
    }
}

// --- Helper Promises with Timeouts ---

function waitForCreds(): Promise<InitializedProps['creds']> {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            if (window.GOOGLE_CREDS && window.GOOGLE_CREDS.API_KEY) {
                clearInterval(interval);
                resolve(window.GOOGLE_CREDS);
            } else if (++attempts > 100) { // 10 second timeout
                clearInterval(interval);
                reject(new Error("No se pudieron cargar las credenciales (timeout). Revisa la 'Snippet Injection' en Netlify."));
            }
        }, 100);
    });
}

function waitForGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window.gapi?.load === 'function') return resolve();
        window.addEventListener('gapiLoaded', () => resolve(), { once: true });
        setTimeout(() => reject(new Error("Timeout esperando el script de Google API (api.js).")), 10000);
    });
}

function waitForGsi(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window.google?.accounts?.oauth2?.initTokenClient === 'function') return resolve();
        window.addEventListener('gsiLoaded', () => resolve(), { once: true });
        setTimeout(() => reject(new Error("Timeout esperando el script de Google Sign-In (gsi/client).")), 10000);
    });
}

// --- UI Components for Loading/Error States ---

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center" aria-live="polite">
            <svg className="animate-spin mx-auto h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-4 text-lg text-gray-700">Iniciando aplicación...</p>
        </div>
    </div>
);

const BootstrapError: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-screen p-4 sm:p-6">
        <div className="p-4 sm:p-8 max-w-3xl mx-auto bg-white rounded-xl shadow-2xl">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-red-800">❌ Error de Inicialización</h1>
                <p className="mt-4 text-base sm:text-lg text-red-700">La aplicación no pudo iniciarse correctamente.</p>
                <p className="mt-2 text-sm text-red-600 bg-red-100 p-3 rounded-md font-mono"><strong>Detalle:</strong> {message}</p>
                <div className="mt-6 text-left bg-red-100 p-4 rounded-md">
                    <p className="font-semibold text-red-900">Pasos para solucionar el problema:</p>
                    <ul className="list-disc list-inside mt-2 text-red-800 space-y-1 text-sm">
                        <li>Ve a <strong>Site settings &gt; Build & deploy &gt; Environment</strong> en Netlify y verifica que `API_KEY`, `CLIENT_ID`, `SPREADSHEET_ID` existan y tengan valores correctos.</li>
                        <li>Ve a <strong>Site settings &gt; Build & deploy &gt; Post processing</strong> y asegúrate de que el "Snippet injection" esté bien configurado.</li>
                        <li>En la <strong>Consola de Google Cloud</strong>, verifica que la URL de tu sitio (`.netlify.app`) esté en "Authorized JavaScript origins" para tu Client ID.</li>
                        <li>Después de hacer cambios, recuerda hacer un **"Trigger deploy"** &gt; **"Deploy site"** en Netlify.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

// --- Start the bootstrap process ---
bootstrap();
