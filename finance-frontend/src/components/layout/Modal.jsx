import React from 'react';

export default function Modal({ isOpen, title, message, type = 'error', onClose, confirmText = 'Tamam', showCancel = false, onCancel }) {
    if (!isOpen) return null;

    const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-[#2962ff]';
    const titleColor = type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-yellow-500' : 'text-[#2962ff]';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#131722] border border-[#2a2e39] rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="p-6 text-center">
                    {/* İKON */}
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${bgColor}/20 mb-4`}>
                        {type === 'error' && <span className={`text-3xl ${titleColor}`}>⚠️</span>}
                        {type === 'success' && <span className={`text-3xl ${titleColor}`}>✅</span>}
                        {type === 'warning' && <span className={`text-3xl ${titleColor}`}>🛡️</span>}
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${titleColor}`}>{title}</h3>
                    <p className="text-[#868993] text-sm mb-6 whitespace-pre-wrap">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-center">
                        {showCancel && (
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 rounded font-bold text-[#d1d4dc] bg-[#1e222d] hover:bg-[#2a2e39] transition w-full"
                            >
                                İptal
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded font-bold text-white ${bgColor} hover:opacity-80 transition w-full`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}