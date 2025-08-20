// UserContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { checkSession } from "../../api";

interface User {
    username: string;
    display_name: string;
    status: string;
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    updateUser: (userData: User | null) => void;
    checkAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateUser = (userData: User | null) => {
        setUser(userData);
    };

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const userData = await checkSession();
            if (userData) {
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return <UserContext.Provider value={{ user, isLoading, updateUser, checkAuth }}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
