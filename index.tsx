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

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

// Render the main application immediately. All loading logic is now handled inside the App component.
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
