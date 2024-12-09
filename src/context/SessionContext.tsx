import React, { createContext, useContext, useState, useEffect } from 'react';
import { StringSession } from 'telegram/sessions';
import { Controller } from '../lib/Controller';

/**
 * Interface for the session context properties.
 */
interface SessionContextProps {
    session: StringSession | null;
    setSession: (session: StringSession | null) => void;
    logout: () => void; 
}

/**
 * Creates a context for managing session state.
 */
const SessionContext = createContext<SessionContextProps | undefined>(undefined);

/**
 * Provides session context to its children.
 * @param children - The child components that will have access to the session context.
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<StringSession | null>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem('stringSession');
        if (savedSession) {
            setSession(new StringSession(savedSession));
        }
    }, []);

    /**
     * Logs out the user by clearing the session and removing it from localStorage.
     */
    const logout = async () => {
        setSession(null);
        await Controller.dropDatabase();
        localStorage.removeItem('stringSession');
    };

    return (
        <SessionContext.Provider value={{ session, setSession, logout }}>
            {children}
        </SessionContext.Provider>
    );
};

/**
 * Custom hook to access the session context.
 * @returns The session context properties.
 * @throws Will throw an error if used outside of a SessionProvider.
 */
export const useSession = (): SessionContextProps => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession deve essere usato all'interno di SessionProvider");
    }
    return context;
};

/**
 * Custom hook to check if the application is in the setting phase.
 * @returns Always returns true.
 */
export const useIsSetting = (): boolean => {
    console.log(Controller.getSettings() !== null);
    return (Controller.getSettings() !== null);
};

/**
 * Custom hook to check if the user is authenticated.
 * @returns True if the user is authenticated, otherwise false.
 */
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
