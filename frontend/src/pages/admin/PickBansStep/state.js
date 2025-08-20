import { useEffect, useMemo, useState } from "react";
import { getPlayerCharacters, getBannedCharacters } from "../../../api";

export const usePickBansState = (player1, player2) => {
    const [player1Characters, setPlayer1Characters] = useState([]);
    const [player2Characters, setPlayer2Characters] = useState([]);
    const [bannedCharacters, setBannedCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter characters to exclude banned ones
    const filteredPlayer1Characters = useMemo(() => {
        return player1Characters.filter(
            (character) => !bannedCharacters.some((banned) => banned.name === character.name)
        );
    }, [player1Characters, bannedCharacters]);

    const filteredPlayer2Characters = useMemo(() => {
        return player2Characters.filter(
            (character) => !bannedCharacters.some((banned) => banned.name === character.name)
        );
    }, [player2Characters, bannedCharacters]);

    const uniqueCharacters = useMemo(() => {
        const combined = [...filteredPlayer1Characters, ...filteredPlayer2Characters];
        const filterRover = combined.filter((c) => !c.name.toLowerCase().includes("rover"));
        const filterDuplicates = filterRover.filter(
            (character, index, self) => self.findIndex((c) => c.name === character.name) === index
        );
        //! RETURN AND ADD GLOBAL ROVER !!!
        const final = [...filterDuplicates, { name: "Rover" }];
        return final;
    }, [filteredPlayer1Characters, filteredPlayer2Characters]);

    useEffect(() => {
        const loadData = async () => {
            if (!player1 || !player2) return;

            setIsLoading(true);
            setError(null);

            try {
                // Load both player characters and banned characters in parallel
                const [charactersResult, bannedResult] = await Promise.all([
                    Promise.all([getPlayerCharacters(player1), getPlayerCharacters(player2)]),
                    getBannedCharacters(player1, player2),
                ]);

                const [result1, result2] = charactersResult;

                // Handle characters loading
                if (result1.success && result2.success) {
                    setPlayer1Characters(result1.data || []);
                    setPlayer2Characters(result2.data || []);
                } else {
                    const errorMessage =
                        (!result1.success ? result1.error + " " : "") + (!result2.success ? result2.error : "");
                    setError(errorMessage.trim() || "Failed to load players' characters");
                }

                // Handle banned characters loading
                if (bannedResult.success) {
                    setBannedCharacters(bannedResult.bannedCharacters || []);
                } else {
                    setError(
                        (prev) => (prev ? prev + " " : "") + (bannedResult.error || "Failed to load banned characters")
                    );
                }
            } catch (err) {
                setError(err.message || "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [player1, player2]);

    return {
        player1Characters: filteredPlayer1Characters,
        player2Characters: filteredPlayer2Characters,
        bannedCharacters,
        uniqueCharacters,
        isLoading,
        error,
    };
};
