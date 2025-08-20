import React, { useEffect, useState } from "react";
import { Bracket, Seed, SeedItem, SeedTeam } from "react-brackets";
import { Trans } from "@lingui/react/macro";
import Header from "../../components/Header";
import TwitchStreamers from "../../components/TwitchStreamers";
import { useHistoryState } from "./state";
import { getAllTournaments } from "../../api";
import styles from "./styles.module.scss";
import TournamentSelect from "../../components/TournamentSelect";
import Item from "../../components/Item";
import { FaSkull, FaHourglass } from "react-icons/fa";
import classNames from "classnames";

const CustomSeed = ({ seed, title, breakpoint, roundIndex, seedIndex, onMatchClick }) => {
    const handleClick = () => {
        const homeTeam = seed.teams[0];
        const awayTeam = seed.teams[1];

        if (
            homeTeam?.player?.username &&
            homeTeam?.player?.username !== "-" &&
            awayTeam?.player?.username &&
            awayTeam?.player?.username !== "-"
        ) {
            onMatchClick({
                player1: homeTeam.player,
                player2: awayTeam.player,
                score1: homeTeam.score,
                score2: awayTeam.score,
                roundIndex,
                seedIndex,
            });
        }
    };

    const homeTeam = seed.teams[0];
    const awayTeam = seed.teams[1];

    return (
        <Seed mobileBreakpoint={breakpoint}>
            <SeedItem onClick={handleClick} style={{ cursor: "pointer" }}>
                <div>
                    <SeedTeam
                        style={{
                            backgroundColor:
                                homeTeam.score > awayTeam.score && homeTeam?.player?.username !== "-"
                                    ? "rgb(7 106 0)"
                                    : "transparent",
                        }}
                    >
                        <div style={{ marginRight: "10px" }}>{homeTeam.score}</div>
                        <div>{homeTeam?.player?.display_name || "-"}</div>
                    </SeedTeam>
                    <SeedTeam
                        style={{
                            backgroundColor:
                                homeTeam.score < awayTeam.score && awayTeam?.player?.username !== "-"
                                    ? "rgb(7 106 0)"
                                    : "transparent",
                        }}
                    >
                        <div>{awayTeam.score}</div>
                        <div>{awayTeam?.player?.display_name || "-"}</div>
                    </SeedTeam>
                </div>
            </SeedItem>
        </Seed>
    );
};

const History = () => {
    const [allTournaments, setAllTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [selectedPlayers, setSelectedPlayers] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const { rounds, isNoActive, loading, error, tourGames } = useHistoryState(selectedTournament?.tournamentName);

    useEffect(() => {
        const fetchTournaments = async () => {
            const result = await getAllTournaments();
            if (result.success) {
                setAllTournaments(result.data);
            }
        };
        fetchTournaments();
    }, []);

    const handleTournamentSelect = (tournament) => {
        setSelectedTournament(tournament);
    };

    const handlePlayersClick = (matchData) => {
        // Find the game with these players
        const game = tourGames.find(
            (game) =>
                (game.players.player1.username === matchData.player1.username &&
                    game.players.player2.username === matchData.player2.username) ||
                (game.players.player1.username === matchData.player2.username &&
                    game.players.player2.username === matchData.player1.username)
        );

        setSelectedPlayers(matchData);
        setSelectedGame(game);
    };

    const closeModal = () => {
        setSelectedPlayers(null);
        setSelectedGame(null);
    };

    const getGalogramName = (gameIndex) => {
        if (!selectedGame?.galograms) return "";
        const galograms = selectedGame.galograms;
        if (gameIndex === 0) return galograms.player1Choose;
        if (gameIndex === 1) return galograms.player2Choose;
        return galograms.random;
    };

    const parseTimeToSeconds = (timeString) => {
        if (!timeString || timeString.length < 5) return 0;

        const [minutes, seconds] = timeString.split(":").map(Number);
        return minutes * 60 + seconds;
    };

    const formatSecondsToTime = (totalSeconds) => {
        const clampedSeconds = Math.max(0, totalSeconds);
        const minutes = Math.floor(clampedSeconds / 60);
        const seconds = Math.floor(clampedSeconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className={styles.bracketContainer}>
            <Header />
            <div className={styles.bracketContent}>
                <div className={styles.tournamentSelect}>
                    <TournamentSelect
                        label=""
                        options={allTournaments}
                        value={selectedTournament}
                        onChange={handleTournamentSelect}
                        placeholder="Choose a tournament"
                        style={{ width: "400px", marginTop: "5px", zIndex: "10" }}
                    />
                </div>
                {selectedTournament && (
                    <div style={{ zIndex: 1, fontSize: "20px" }}>
                        {selectedTournament?.startDate} - {selectedTournament?.endDate}
                    </div>
                )}
                {loading && !selectedTournament ? (
                    <div className={styles.noActiveContent}>
                        <p className={styles.noActiveText}>
                            <Trans>Loading tournaments...</Trans>
                        </p>
                    </div>
                ) : error ? (
                    <div className={styles.noActiveContent}>
                        <p className={styles.noActiveText}>{error}</p>
                    </div>
                ) : !selectedTournament ? (
                    <div className={styles.noActiveContent}>
                        <p className={styles.noActiveText}>
                            <Trans>Choose Tournament from list</Trans>
                        </p>
                    </div>
                ) : isNoActive ? (
                    <div className={styles.noActiveContent}>
                        <p className={styles.noActiveText}>
                            <Trans>No games for this tournament</Trans>
                        </p>
                    </div>
                ) : (
                    <Bracket
                        key={selectedTournament}
                        rounds={rounds}
                        renderSeedComponent={(props) => <CustomSeed {...props} onMatchClick={handlePlayersClick} />}
                    />
                )}
            </div>
            <div className={styles.streamers}>
                <TwitchStreamers />
            </div>

            {/* Модальное окно. МОЖНО ВЫНЕСТИ В ОТДЕЛЬНЫЙ КОМПОНЕНТ И ПЕРЕИСПОЛЬЗОВАТЬ ЗДЕСЬ И НА ТАЙМЕРАХ */}
            {selectedPlayers && (
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        border: "1px solid #444",
                        borderRadius: "8px",
                        padding: "20px",
                        zIndex: 1000,
                        minWidth: "850px",
                        maxWidth: "90%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 0 20px rgba(136, 0, 255, 0.7)",
                        color: "white",
                    }}
                >
                    <button
                        onClick={closeModal}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "none",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "18px",
                        }}
                    >
                        ×
                    </button>
                    {!selectedGame?.galograms ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>
                            <Trans>The game has not been played yet</Trans>
                        </div>
                    ) : (
                        <div className={styles.timersWrapper}>
                            <div className={styles.timersContent}>
                                <div className={styles.names}>
                                    <div className={styles.leftName}>{selectedPlayers.player1.display_name}</div>
                                    <div className={styles.ggold}>VS</div>
                                    <div className={styles.rightName}>{selectedPlayers.player2.display_name}</div>
                                </div>
                                <div className={styles.games}>
                                    {selectedGame.games.map((game, i) => {
                                        return (
                                            <div key={i} className={styles.gameContainer}>
                                                <div className={styles.titleGold}>Game {i + 1}</div>
                                                <div className={styles.gameContent}>
                                                    <div className={styles.playerChars}>
                                                        {game.player1Picks.map((ch, i) => (
                                                            <Item
                                                                key={`${ch?.name}${i}`}
                                                                showTrash={false}
                                                                showStats={true}
                                                                canEdit={false}
                                                                type="character"
                                                                name={ch?.name}
                                                                value1={ch?.value1}
                                                                value2={ch?.value2}
                                                                rarity={4}
                                                            />
                                                        ))}
                                                    </div>
                                                    <Item
                                                        key={"galogram"}
                                                        showTrash={false}
                                                        showStats={false}
                                                        canEdit={false}
                                                        type="galogram"
                                                        name={getGalogramName(i)}
                                                        rarity={5}
                                                    />
                                                    <div className={styles.playerChars}>
                                                        {game.player2Picks.map((ch, i) => (
                                                            <Item
                                                                key={`${ch?.name}${i}`}
                                                                showTrash={false}
                                                                showStats={true}
                                                                canEdit={false}
                                                                type="character"
                                                                name={ch?.name}
                                                                value1={ch?.value1}
                                                                value2={ch?.value2}
                                                                rarity={4}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={styles.timers}>
                                                    <input
                                                        type="text"
                                                        value={game.timers?.player1Time || ""}
                                                        readOnly
                                                        placeholder="00:00"
                                                        maxLength={5}
                                                        className={classNames(styles.timerInput)}
                                                        style={game.timers?.player1Time ? {} : { textShadow: "none" }}
                                                    />
                                                    <div className={styles.vDivider}></div>
                                                    <div className={styles.totalDifference}>
                                                        {game.timers?.difference}
                                                    </div>
                                                    <div className={styles.vDivider}></div>
                                                    <input
                                                        type="text"
                                                        value={game.timers?.player2Time || ""}
                                                        readOnly
                                                        placeholder="00:00"
                                                        maxLength={5}
                                                        className={classNames(styles.timerInput)}
                                                        style={game.timers?.player2Time ? {} : { textShadow: "none" }}
                                                    />
                                                </div>
                                                <div className={styles.checks}>
                                                    <div className={styles.playerChecks}>
                                                        <div className={styles.attempts}>
                                                            {["attempt1", "attempt2", "attempt3"].map(
                                                                (attempt, idx) => (
                                                                    <label key={attempt}>
                                                                        <input
                                                                            className={styles.attemptLeftCheckbox}
                                                                            type="checkbox"
                                                                            checked={
                                                                                game.timers?.player1Checks[attempt] ||
                                                                                false
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className={styles.redChecks}>
                                                            <label className={styles.checkboxContainer}>
                                                                <input
                                                                    className={styles.diedLeftCheckbox}
                                                                    type="checkbox"
                                                                    checked={game.timers?.player1Checks.died || false}
                                                                    readOnly
                                                                />
                                                                <FaSkull className={styles.skullIcon} />
                                                            </label>
                                                            <label className={styles.checkboxContainer}>
                                                                <input
                                                                    className={styles.diedLeftCheckbox}
                                                                    type="checkbox"
                                                                    checked={
                                                                        game.timers?.player1Checks.timeExceeded || false
                                                                    }
                                                                    readOnly
                                                                />
                                                                <FaHourglass className={styles.skullIcon} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className={styles.hDivider}></div>
                                                    </div>
                                                    <div className={styles.playerChecks}>
                                                        <div className={styles.redChecks}>
                                                            <label className={styles.checkboxContainer}>
                                                                <input
                                                                    className={styles.diedRightCheckbox}
                                                                    type="checkbox"
                                                                    checked={
                                                                        game.timers?.player2Checks.timeExceeded || false
                                                                    }
                                                                    readOnly
                                                                />
                                                                <FaHourglass className={styles.skullIcon} />
                                                            </label>
                                                            <label className={styles.checkboxContainer}>
                                                                <input
                                                                    className={styles.diedRightCheckbox}
                                                                    type="checkbox"
                                                                    checked={game.timers?.player2Checks.died || false}
                                                                    readOnly
                                                                />
                                                                <FaSkull className={styles.skullIcon} />
                                                            </label>
                                                        </div>
                                                        <div className={styles.attempts}>
                                                            {["attempt3", "attempt2", "attempt1"].map(
                                                                (attempt, idx) => (
                                                                    <label key={attempt}>
                                                                        <input
                                                                            className={styles.attemptRightCheckbox}
                                                                            type="checkbox"
                                                                            checked={
                                                                                game.timers?.player2Checks[attempt] ||
                                                                                false
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className={styles.totalSection}>
                                        <div className={styles.titleGold}>Total</div>
                                        <div className={styles.totalContainer}>
                                            <div className={styles.totalTime}>
                                                <div>
                                                    {formatSecondsToTime(
                                                        selectedGame.games.reduce((acc, game) => {
                                                            return acc + parseTimeToSeconds(game.timers?.player1Time);
                                                        }, 0)
                                                    )}
                                                </div>
                                                <p className={styles.ggold}>| {selectedGame.player1Score}</p>
                                            </div>
                                            <div className={styles.totalDifference}>
                                                {formatSecondsToTime(
                                                    selectedGame.games.reduce((acc, game) => {
                                                        return acc + parseTimeToSeconds(game.timers?.difference);
                                                    }, 0)
                                                )}
                                            </div>
                                            <div className={styles.totalTime}>
                                                <p className={styles.ggold}>{selectedGame.player2Score} |</p>
                                                <div>
                                                    {formatSecondsToTime(
                                                        selectedGame.games.reduce((acc, game) => {
                                                            return acc + parseTimeToSeconds(game.timers?.player2Time);
                                                        }, 0)
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
