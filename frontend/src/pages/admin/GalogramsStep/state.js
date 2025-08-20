import { useEffect, useState } from "react";
import { useAdmin } from "../../../state-providers/AdminContext";

import { getPlayers, getActiveTournament, getBannedCharacters } from "../../../api";

export const useGalogramsState = () => {
    const {
        players: { player1, player2 },
        updateState,
    } = useAdmin();

    const [bannedCharacters, setBannedCharacters] = useState([]);
    const [players, setPlayers] = useState([]);
    const [activeTournament, setActiveTournament] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [playersResult, tournamentResult] = await Promise.all([getPlayers(), getActiveTournament()]);

                const errors = [];

                if (playersResult.success) {
                    setPlayers(playersResult.data || []);
                } else {
                    errors.push(playersResult.error);
                }

                if (tournamentResult.success) {
                    updateState("tournament", tournamentResult.data);
                    setActiveTournament(tournamentResult.data);
                } else {
                    errors.push(tournamentResult.error);
                }

                if (errors.length > 0) {
                    setError(errors.join("; "));
                }
            } catch (err) {
                setError(err.message || "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const loadBannedCharacters = async () => {
            if (!player1 || !player2) return;

            setIsLoading(true);
            try {
                const result = await getBannedCharacters(player1.username, player2.username);
                if (result.success) {
                    setBannedCharacters(result.bannedCharacters || []);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                setError(err.message || "Failed to load banned characters");
            } finally {
                setIsLoading(false);
            }
        };

        loadBannedCharacters();
    }, [player1, player2]);

    return {
        players,
        activeTournament,
        bannedCharacters,
        isLoading,
        error,
    };
};
