import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    fullWidth?: boolean;
    scrollBody?: boolean;
}

const FullModal: React.FC<ModalProps> = ({ isOpen, onClose, children, fullWidth = false, scrollBody = true }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div
                ref={modalRef}
                className={`rounded-lg shadow-xl overflow-hidden transition-all transform ${
                    fullWidth ? 'w-[90%] max-h-[90vh]' : 'max-w-3xl w-full max-h-[90vh]'
                }`}
            >
                <div className="flex justify-end p-4">
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 focus:outline-none"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div
                    className={`px-6 pb-6 ${scrollBody ? "overflow-y-auto max-h-[calc(90vh-80px)]" : "overflow-hidden"}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default FullModal;
