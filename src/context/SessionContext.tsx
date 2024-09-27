import React, { createContext, useContext, useState, useEffect } from 'react';
import { StringSession } from 'telegram/sessions';

// Tipi del contesto
interface SessionContextProps {
    session: StringSession | null;
    setSession: (session: StringSession | null) => void;
}

// Creazione del contesto
const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<StringSession | null>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem('stringSession');
        if (savedSession) {
            setSession(new StringSession(savedSession));
        }
    }, []);

    return (
        <SessionContext.Provider value={{ session, setSession }}>
            {children}
        </SessionContext.Provider>
    );
};

// Hook per accedere al contesto
export const useSession = (): SessionContextProps => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession deve essere usato all'interno di SessionProvider");
    }
    return context;
};

export const useIsSetting = (): boolean => {
    return true;
}

export const useIsAuthenticated = (): boolean => {
    const { session } = useSession();
    if (session === null) {
      return false;
    }
  
    const savedSession = localStorage.getItem('stringSession') as string;
    try {
      StringSession.decode(savedSession);
      new StringSession(savedSession);
    } catch (error) {
      return false;
    }
    return true;
  };
  
