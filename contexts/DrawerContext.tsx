import React, { createContext, useContext, useState } from 'react';

interface DrawerContextType {
    isOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
    const context = useContext(DrawerContext);
    if (context === undefined) {
        throw new Error('useDrawer must be used within a DrawerProvider');
    }
    return context;
};

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openDrawer = () => setIsOpen(true);
    const closeDrawer = () => setIsOpen(false);
    const toggleDrawer = () => setIsOpen(prev => !prev);

    return (
        <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
            {children}
        </DrawerContext.Provider>
    );
};
