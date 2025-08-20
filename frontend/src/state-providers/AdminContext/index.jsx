import React, { createContext, useContext, useState } from "react";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [adminState, setAdminState] = useState({
        step: 1,
        players: {
            player1: null,
            player2: null,
        },
        player1Score: 0,
        player2Score: 0,
        galograms: {
            player1Ban: null,
            player2Ban: null,
            player1Choose: null,
            player2Choose: null,
            random: null,
        },
        tournament: null,
        games: [],
        immunityCharacters: [],
        bannedCharacters: [],
    });

    const nextStep = () => setAdminState((prev) => ({ ...prev, step: prev.step + 1 }));
    const prevStep = () => setAdminState((prev) => ({ ...prev, step: prev.step - 1 }));

    const updateState = (key, value) => {
        setAdminState((prev) => {
            if (key.includes(".")) {
                const [parentKey, childKey] = key.split(".");
                return {
                    ...prev,
                    [parentKey]: {
                        ...prev[parentKey],
                        [childKey]: value,
                    },
                };
            }
            return { ...prev, [key]: value };
        });
    };

    const addGame = (gameData) => {
        setAdminState((prev) => ({
            ...prev,
            games: [...prev.games, gameData],
        }));
    };

    const resetState = () => {
        setAdminState({
            step: 1,
            players: {
                player1: null,
                player2: null,
            },
            player1Score: 0,
            player2Score: 0,
            galograms: {
                player1Ban: null,
                player2Ban: null,
                player1Choose: null,
                player2Choose: null,
                random: null,
            },
            tournament: null,
            games: [],
            immunityCharacters: [],
            bannedCharacters: [],
        });
    };

    return (
        <AdminContext.Provider
            value={{
                ...adminState,
                nextStep,
                prevStep,
                updateState,
                addGame,
                resetState,
                finalState: adminState,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
