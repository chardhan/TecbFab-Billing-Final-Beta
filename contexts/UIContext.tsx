
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType, ToastProps } from '../components/ui/Toast';
import { Modal, ModalType } from '../components/ui/Modal';

interface UIContextType {
    toast: (message: string, type?: ToastType) => void;
    alert: (message: string, title?: string) => Promise<void>;
    confirm: (message: string, title?: string, confirmLabel?: string) => Promise<boolean>;
    prompt: (message: string, title?: string, defaultValue?: string) => Promise<string | null>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: ReactNode;
        type: ModalType;
        confirmLabel?: string;
        cancelLabel?: string;
        defaultValue?: string;
        resolve: (value: any) => void;
    } | null>(null);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, onClose: dismissToast }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const createModalPromise = useCallback((type: ModalType, message: string, title: string = 'Notification', options: any = {}) => {
        return new Promise<any>((resolve) => {
            setModalConfig({
                isOpen: true,
                title,
                message,
                type,
                resolve,
                ...options
            });
        });
    }, []);

    const alert = useCallback((message: string, title: string = 'Alert') => {
        return createModalPromise('alert', message, title).then(() => {
            setModalConfig(null);
        });
    }, [createModalPromise]);

    const confirm = useCallback((message: string, title: string = 'Confirm', confirmLabel: string = 'Confirm') => {
        return createModalPromise('confirm', message, title, { confirmLabel }).then((result: boolean) => {
            setModalConfig(null);
            return result;
        });
    }, [createModalPromise]);

    const prompt = useCallback((message: string, title: string = 'Input Required', defaultValue: string = '') => {
        return createModalPromise('prompt', message, title, { defaultValue }).then((result: string | null) => {
            setModalConfig(null);
            return result;
        });
    }, [createModalPromise]);

    const handleModalConfirm = (value?: string) => {
        if (modalConfig) {
            if (modalConfig.type === 'confirm') modalConfig.resolve(true);
            else if (modalConfig.type === 'prompt') modalConfig.resolve(value);
            else modalConfig.resolve(true);
        }
    };

    const handleModalCancel = () => {
        if (modalConfig) {
            if (modalConfig.type === 'confirm') modalConfig.resolve(false);
            else if (modalConfig.type === 'prompt') modalConfig.resolve(null);
            else modalConfig.resolve(true); // Alert close
        }
    };

    return (
        <UIContext.Provider value={{ toast, alert, confirm, prompt }}>
            {children}
            <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => <Toast key={t.id} {...t} />)}
            </div>
            {modalConfig && (
                <Modal
                    isOpen={modalConfig.isOpen}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    defaultValue={modalConfig.defaultValue}
                    confirmLabel={modalConfig.confirmLabel}
                    onConfirm={handleModalConfirm}
                    onCancel={handleModalCancel}
                />
            )}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
};
