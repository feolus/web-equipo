import React from 'react';

interface ResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-[90%] sm:w-full mx-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900">¿Estás seguro?</h3>
                <p className="mt-2 text-sm text-gray-600">Esta acción es irreversible. Se borrarán todos los nombres de jugadores y datos de rendimiento locales y se restablecerán a los valores predeterminados.</p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Sí, Resetear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetModal;