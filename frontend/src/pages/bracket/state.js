import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addTournamentGame, getActiveTournamentGames } from "../../api";

export const useBracketState = () => {
    const navigate = useNavigate();

    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isNoActive, setIsNoActive] = useState(false);
    const [tournamentName, setTournamentName] = useState("");

    // Функция для определения победителя матча
    const getWinner = (game) => {
        if (!game) return null;
        if (game.player1Score > game.player2Score) {
            return game.teams[0];
        } else if (game.player2Score > game.player1Score) {
            return game.teams[1];
        }
        return null;
    };

    // Функция для генерации первого раунда
    const generateFirstRound = (games) => {
        return Array.from({ length: 16 }, (_, i) => {
            // Try to find the game in the original position first
            let originalGame = games?.[i];

            // Then look for any game that has these players in any order
            const player1Username = originalGame?.players?.player1?.username || "-";
            const player2Username = originalGame?.players?.player2?.username || "-";

            let actualGame = games.find((game) => {
                const gamePlayer1 = game.players?.player1?.username;
                const gamePlayer2 = game.players?.player2?.username;

                return gamePlayer1 === player2Username && gamePlayer2 === player1Username;
            });

            // Use the actual game if found, otherwise use the original
            const gameToUse = actualGame || originalGame;

            const player1 = gameToUse?.players?.player1 || { username: "-", display_name: "-" };
            const player2 = gameToUse?.players?.player2 || { username: "-", display_name: "-" };
            const score1 = gameToUse?.player1Score || 0;
            const score2 = gameToUse?.player2Score || 0;

            return {
                id: i + 1,
                teams: [
                    { player: player1, score: score1 },
                    { player: player2, score: score2 },
                ],
                player1Score: score1,
                player2Score: score2,
                navigate,
            };
        });
    };

    // Общая функция для создания матча между двумя победителями
    const createMatch = (game1, game2, games, id) => {
        const winner1 = getWinner(game1);
        const winner2 = getWinner(game2);

        let findGame = null;
        if (winner1 !== null && winner2 !== null) {
            findGame = games.find(
                (game) =>
                    (game.players.player1.username === winner1.player.username &&
                        game.players.player2.username === winner2.player.username) ||
                    (game.players.player1.username === winner2.player.username &&
                        game.players.player2.username === winner1.player.username)
            );
        }

        const score1 = findGame
            ? findGame?.players?.player1?.username === winner1?.player?.username
                ? findGame.player1Score
                : findGame.player2Score
            : 0;
        const score2 = findGame
            ? score1 === findGame.player1Score
                ? findGame.player2Score
                : findGame.player1Score
            : 0;

        if (!findGame && (winner1?.player?.username === "-" || winner2?.player?.username === "-")) {
            const gameData1 = {
                tournamentName: tournamentName,
                tournament: {
                    tournamentName: tournamentName,
                },
                players: {
                    player1: winner1?.player || {},
                    player2: winner2?.player || {},
                },
                player1Score: winner1?.player?.username === "-" ? 0 : 2,
                player2Score: winner2?.player?.username === "-" ? 0 : 2,
            };

            const gameData2 = {
                tournamentName: tournamentName,
                tournament: {
                    tournamentName: tournamentName,
                },
                players: {
                    player1: winner2?.player || {},
                    player2: winner1?.player || {},
                },
                player1Score: winner2?.player?.username === "-" ? 0 : 2,
                player2Score: winner1?.player?.username === "-" ? 0 : 2,
            };

            addTournamentGame(gameData1);
            addTournamentGame(gameData2);
        }

        return {
            id,
            teams: [
                { player: winner1?.player || "-", score: score1 },
                { player: winner2?.player || "-", score: score2 },
            ],
            player1Score: score1,
            player2Score: score2,
            navigate,
        };
    };

    // Функция для создания раунда
    const generateRound = (previousRound, games, roundSize, roundId, roundTitle) => {
        const seeds = Array.from({ length: roundSize / 2 }, (_, i) => {
            const game1 = previousRound[i * 2];
            const game2 = previousRound[i * 2 + 1];
            return createMatch(game1, game2, games, roundId + i);
        });

        return {
            title: roundTitle,
            seeds,
        };
    };

    // Функция для создания последующих раундов на основе предыдущих
    const generateNextRounds = (firstRoundSeeds, games) => {
        const roundsData = [
            {
                title: "Round of 16",
                seeds: firstRoundSeeds,
            },
        ];

        const roundConfigs = [
            { size: 16, title: "Round of 8", nextId: 17 },
            { size: 8, title: "Quarterfinals", nextId: 25 },
            { size: 4, title: "Semifinals", nextId: 29 },
            { size: 2, title: "Final", nextId: 31 },
        ];

        let previousRound = firstRoundSeeds;
        let currentRoundId = 17;
        let semifinalGames = []; // Store semifinal games for third-place match

        for (const config of roundConfigs) {
            if (previousRound.length <= 1) break;

            const round = generateRound(previousRound, games, config.size, currentRoundId, config.title);

            // Store semifinal games if this is the semifinals round
            if (config.title === "Semifinals") {
                semifinalGames = round.seeds;
            }

            roundsData.push(round);
            previousRound = round.seeds;
            currentRoundId += config.size / 2;
        }

        // Add third-place match if we have semifinal games
        if (semifinalGames.length === 2) {
            // Get losers from semifinals
            const loser1 = getLoser(semifinalGames[0]);
            const loser2 = getLoser(semifinalGames[1]);

            // Find if there's already a game between these players
            let thirdPlaceGame = games.find(
                (game) =>
                    (game.players.player1.username === loser1?.player?.username &&
                        game.players.player2.username === loser2?.player?.username) ||
                    (game.players.player1.username === loser2?.player?.username &&
                        game.players.player2.username === loser1?.player?.username)
            );

            const score1 = thirdPlaceGame
                ? thirdPlaceGame.players.player1.username === loser1?.player?.username
                    ? thirdPlaceGame.player1Score
                    : thirdPlaceGame.player2Score
                : 0;
            const score2 = thirdPlaceGame
                ? score1 === thirdPlaceGame.player1Score
                    ? thirdPlaceGame.player2Score
                    : thirdPlaceGame.player1Score
                : 0;

            roundsData.push({
                title: "Third Place",
                seeds: [
                    {
                        id: 33, // New ID for third place match
                        teams: [
                            { player: loser1?.player || "-", score: score1 },
                            { player: loser2?.player || "-", score: score2 },
                        ],
                        player1Score: score1,
                        player2Score: score2,
                        navigate,
                    },
                ],
            });
        }

        return roundsData;
    };

    // Helper function to get the loser of a match
    const getLoser = (game) => {
        if (!game) return null;
        if (game.player1Score < game.player2Score) {
            return game.teams[0];
        } else if (game.player2Score < game.player1Score) {
            return game.teams[1];
        }
        return null;
    };

    useEffect(() => {
        const fetchTournamentGames = async () => {
            try {
                const result = await getActiveTournamentGames();
                if (result.success) {
                    const gameWithName = result.games.find((game) => game.tournament?.tournamentName);
                    if (gameWithName) {
                        setTournamentName(gameWithName.tournament.tournamentName);
                    }

                    const firstRoundSeeds = generateFirstRound(result.games);
                    const transformedRounds = generateNextRounds(firstRoundSeeds, result.games);
                    setRounds(transformedRounds);
                } else {
                    setIsNoActive(true);
                    setError(result.error);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTournamentGames();
    }, []);

    const defaultRounds = [
        {
            title: "Round of 16",
            seeds: Array.from({ length: 16 }, (_, i) => ({
                id: i,
                teams: [
                    { name: "-", score: 0 },
                    { name: "-", score: 0 },
                ],
            })),
        },
        {
            title: "Round of 8",
            seeds: Array.from({ length: 8 }, (_, i) => ({
                id: 17 + i,
                teams: [
                    { name: "-", score: 0 },
                    { name: "-", score: 0 },
                ],
            })),
        },
        {
            title: "Quarterfinals",
            seeds: Array.from({ length: 4 }, (_, i) => ({
                id: 25 + i,
                teams: [
                    { name: "-", score: 0 },
                    { name: "-", score: 0 },
                ],
            })),
        },
        {
            title: "Semifinals",
            seeds: Array.from({ length: 2 }, (_, i) => ({
                id: 29 + i,
                teams: [
                    { name: "-", score: 0 },
                    { name: "-", score: 0 },
                ],
            })),
        },
        {
            title: "Final",
            seeds: [
                {
                    id: 31,
                    teams: [
                        { name: "-", score: 0 },
                        { name: "-", score: 0 },
                    ],
                },
            ],
        },
        {
            title: "Third Place",
            seeds: [
                {
                    id: 33,
                    teams: [
                        { name: "-", score: 0 },
                        { name: "-", score: 0 },
                    ],
                },
            ],
        },
    ];

    return { rounds, defaultRounds, loading, error, isNoActive, tournamentName };
};
