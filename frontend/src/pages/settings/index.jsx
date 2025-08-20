import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import TwitchStreamers from "../../components/TwitchStreamers";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../state-providers/UserContext";
import {
    createTournament,
    deactivateAllTournaments,
    getAllTournaments,
    updateTournament,
    getTournamentGamesByName,
    getPlayers,
    addTournamentGame,
    deleteTournamentGame,
    updateTournamentGame,
    deleteTournament,
} from "../../api";
import PlayerSelect from "../../components/PlayerSelect";

const Settings = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useUser();

    const [tournaments, setTournaments] = useState([]);
    const [newTournament, setNewTournament] = useState({
        tournamentName: "",
        startDate: "",
        endDate: "",
        active: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTournamentGames, setActiveTournamentGames] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({
        player1: null,
        player2: null,
    });

    useEffect(() => {
        const isAdmin = user?.status === "admin";
        if (!user || !isAdmin) {
            !isLoading && navigate("/401");
        }
        if (isAdmin) {
            fetchTournaments();
            fetchAllPlayers();
        }
    }, [user, isLoading, navigate]);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const response = await getAllTournaments();
            setTournaments(response.data);

            const activeTournament = response.data.find((t) => t.active);
            if (activeTournament) {
                const gamesResponse = await getTournamentGamesByName(activeTournament.tournamentName);

                // Первые 16 игр (определяют пары игроков)
                const firstGames = gamesResponse.games.slice(0, 16);
                setActiveTournamentGames(firstGames || []);
            } else {
                setActiveTournamentGames([]);
            }
        } catch (err) {
            setError("Failed to load tournaments");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPlayers = async () => {
        try {
            const response = await getPlayers();
            setAllPlayers(response.data || []);
        } catch (err) {
            setError("Failed to load players");
        }
    };

    const handleCreateTournament = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createTournament(newTournament);

            setNewTournament({
                tournamentName: "",
                startDate: "",
                endDate: "",
                active: false,
            });
            await fetchTournaments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create tournament");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTournament = async (tournamentName) => {
        try {
            setLoading(true);
            await deleteTournament(tournamentName);
            await fetchTournaments();
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete tournament");
        } finally {
            setLoading(false);
        }
    };

    const toggleTournamentStatus = async (tournamentId, currentStatus) => {
        try {
            setLoading(true);
            // Деактивируем все турниры, если активируем текущий
            if (!currentStatus) {
                await deactivateAllTournaments();
            }

            await updateTournament(tournamentId, {
                active: !currentStatus,
            });

            await fetchTournaments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update tournament");
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerSelect = (player, field) => {
        setSelectedPlayers((prev) => ({
            ...prev,
            [field]: player,
        }));
    };

    const handleAddGamePair = async () => {
        const activeTournament = tournaments.find((t) => t.active);
        if (!activeTournament) {
            setError("No active tournament selected");
            return;
        }

        if (!selectedPlayers.player1 || !selectedPlayers.player2) {
            setError("Please select both players");
            return;
        }

        if (selectedPlayers.player1.username === selectedPlayers.player2.username) {
            setError("Players must be different");
            return;
        }

        try {
            setLoading(true);
            const gameData = {
                tournament: { tournamentName: activeTournament.tournamentName },
                players: selectedPlayers,
            };

            await addTournamentGame(gameData);
            await fetchTournaments();
            setSelectedPlayers({ player1: null, player2: null });
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add game pair");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGamePair = async (gameId, field, newPlayer) => {
        try {
            setLoading(true);
            const gameToUpdate = activeTournamentGames.find((game) => game._id === gameId);

            if (!gameToUpdate) {
                setError("Game not found");
                return;
            }

            const updatedPlayers = {
                ...gameToUpdate.players,
                [field]: newPlayer,
            };

            await updateTournamentGame(gameId, {
                userName1: updatedPlayers.player1.username,
                userName2: updatedPlayers.player2.username,
                players: updatedPlayers,
                player1Score: 0,
                player2Score: 0,
            });
            await fetchTournaments();
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update game pair");
        } finally {
            setLoading(false);
        }
    };

    // const getAvailablePlayers = () => {
    //     const activeTournament = tournaments.find((t) => t.active);
    //     if (!activeTournament) return allPlayers;

    //     const usedPlayers = new Set();
    //     activeTournamentGames.forEach((game) => {
    //         if (game?.players?.player1?.username) usedPlayers.add(game.players.player1.username);
    //         if (game?.players?.player1?.username) usedPlayers.add(game.players.player2.username);
    //     });

    //     return allPlayers.filter((player) => !usedPlayers.has(player.username));
    // };

    const handleDeleteGamePair = async (gameId) => {
        try {
            setLoading(true);
            await deleteTournamentGame(gameId);
            await fetchTournaments();
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete game pair");
        } finally {
            setLoading(false);
        }
    };

    // const availablePlayers = getAvailablePlayers();
    const activeTournament = tournaments.find((t) => t.active);
    const canAddMoreGames = activeTournamentGames.length < 16;

    return (
        <div className={styles.settingsContainer}>
            <Header />
            <div className={styles.settingsContent}>
                <div className={styles.tournament}>
                    <div className={styles.tournamentForm}>
                        <h3>Create New Tournament</h3>
                        <form onSubmit={handleCreateTournament}>
                            <div className={styles.formGroup}>
                                <p>Tournament Name:</p>
                                <input
                                    type="text"
                                    value={newTournament.tournamentName}
                                    onChange={(e) =>
                                        setNewTournament({ ...newTournament, tournamentName: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <p>Start Date:</p>
                                <input
                                    type="date"
                                    value={newTournament.startDate}
                                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <p>End Date:</p>
                                <input
                                    type="date"
                                    value={newTournament.endDate}
                                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                                    required
                                    min={newTournament.startDate}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={newTournament.active}
                                        onChange={(e) =>
                                            setNewTournament({ ...newTournament, active: e.target.checked })
                                        }
                                    />
                                    Set as active tournament
                                </label>
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Tournament"}
                            </button>
                        </form>
                    </div>

                    <div className={styles.tournamentList}>
                        <h3>Existing Tournaments</h3>
                        {loading && tournaments.length === 0 ? (
                            <div>Loading tournaments...</div>
                        ) : tournaments.length === 0 ? (
                            <div>No tournaments found</div>
                        ) : (
                            <table className={styles.tournamentTable}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournaments.map((tournament) => (
                                        <tr key={tournament.tournamentName}>
                                            <td>{tournament.tournamentName}</td>
                                            <td>{tournament.startDate}</td>
                                            <td>{tournament.endDate}</td>
                                            <td>
                                                <span className={tournament.active ? styles.active : styles.inactive}>
                                                    {tournament.active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionsContainer}>
                                                    <button
                                                        onClick={() =>
                                                            toggleTournamentStatus(
                                                                tournament.tournamentName,
                                                                tournament.active
                                                            )
                                                        }
                                                        disabled={loading}
                                                        className={tournament.active ? styles.deactivateBtn : ""}
                                                    >
                                                        {tournament.active ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteTournament(tournament.tournamentName)
                                                        }
                                                        disabled={loading}
                                                        className={styles.deactivateBtn}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                </div>

                {activeTournament && (
                    <div className={styles.gamePairsSection}>
                        <div className={styles.addPairForm}>
                            <h3>Manage Game Pairs for active tournament: {activeTournament.tournamentName}</h3>
                            <p>Created pairs: {activeTournamentGames.length}/16</p>

                            <div className={styles.addPairSelect}>
                                <PlayerSelect
                                    label="Player 1"
                                    options={allPlayers}
                                    value={selectedPlayers.player1}
                                    onChange={(player) => handlePlayerSelect(player, "player1")}
                                    placeholder="Select first player"
                                    disabled={!canAddMoreGames}
                                />
                                <PlayerSelect
                                    label="Player 2"
                                    options={allPlayers}
                                    value={selectedPlayers.player2}
                                    onChange={(player) => handlePlayerSelect(player, "player2")}
                                    placeholder="Select second player"
                                    disabled={!canAddMoreGames}
                                />
                            </div>
                            <button onClick={handleAddGamePair} disabled={!canAddMoreGames || loading}>
                                {loading ? "Adding..." : "Add Pair"}
                            </button>
                        </div>

                        {activeTournamentGames.length > 0 && (
                            <div className={styles.pairsList}>
                                <h4>Game Pairs</h4>
                                <table className={styles.tournamentTable}>
                                    <thead>
                                        <tr>
                                            <th>№</th>
                                            <th>Player 1</th>
                                            <th>Player 2</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTournamentGames.map((game, index) => (
                                            <tr key={game._id || index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className={styles.playerSelectWrapper}>
                                                        <PlayerSelect
                                                            options={allPlayers}
                                                            value={game.players.player1}
                                                            onChange={(player) =>
                                                                handleUpdateGamePair(game._id, "player1", player)
                                                            }
                                                            disabled={loading}
                                                            excludePlayers={activeTournamentGames
                                                                .filter((g) => g._id !== game._id)
                                                                .flatMap((g) => [g.players.player1, g.players.player2])
                                                                .filter(Boolean)}
                                                            hideLabel
                                                            compact
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.playerSelectWrapper}>
                                                        <PlayerSelect
                                                            options={allPlayers}
                                                            value={game.players.player2}
                                                            onChange={(player) =>
                                                                handleUpdateGamePair(game._id, "player2", player)
                                                            }
                                                            disabled={loading}
                                                            excludePlayers={activeTournamentGames
                                                                .filter((g) => g._id !== game._id)
                                                                .flatMap((g) => [g.players.player1, g.players.player2])
                                                                .filter(Boolean)}
                                                            hideLabel
                                                            compact
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleDeleteGamePair(game._id)}
                                                        disabled={loading}
                                                        className={styles.deactivateBtn}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div style={{ zIndex: 1 }}>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default Settings;
