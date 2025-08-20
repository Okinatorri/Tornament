import React, { useState } from "react";
import { useAdmin } from "../../../state-providers/AdminContext";

import Item from "../../../components/Item";

import { addTournamentGame } from "../../../api";

import { FaHourglass, FaSkull } from "react-icons/fa";

import classNames from "classnames";
import styles from "./styles.module.scss";

export const TimersStep = () => {
    const {
        prevStep,
        players: { player1, player2 },
        galograms: { player1Choose, player2Choose, random },
        player1Score,
        player2Score,
        games,
        updateState,
        resetState,
        finalState,
    } = useAdmin();

    const [showTotal, setShowTotal] = useState(false);

    const [timers, setTimers] = useState(() => {
        return games.map(
            (game) =>
                game.timers || {
                    player1Time: "",
                    player2Time: "",
                    difference: "00:00",
                    player1Checks: {
                        timeExceeded: false,
                        died: false,
                        attempt1: false,
                        attempt2: false,
                        attempt3: false,
                    },
                    player2Checks: {
                        timeExceeded: false,
                        died: false,
                        attempt1: false,
                        attempt2: false,
                        attempt3: false,
                    },
                }
        );
    });

    const updateGameWithTimers = (gameIndex, timerData) => {
        const updatedGames = [...games];
        updatedGames[gameIndex] = {
            ...updatedGames[gameIndex],
            timers: timerData,
        };
        updateState("games", updatedGames);
    };

    const handlePrevStep = () => {
        if (player1Score == 2 || player2Score == 2 || games.length >= 3) {
            setShowTotal(true);
        } else {
            prevStep();
        }
    };

    const handleSubmit = async () => {
        await addTournamentGame(finalState);
        resetState();
    };

    const getGalogramName = (number) => {
        switch (number) {
            case 0:
                return player1Choose;
            case 1:
                return player2Choose;
            case 2:
                return random;
            default:
                return "";
        }
    };

    const getCurrentPenalty = (checkType) => {
        switch (checkType) {
            case "attempt1":
                return 0;
            case "attempt2":
                return 5;
            case "attempt3":
                return 10;
            default:
                return 0;
        }
    };

    const formatTimeInput = (value) => {
        let numbers = value.replace(/\D/g, "");

        numbers = numbers.slice(0, 4);

        if (numbers.length > 2) {
            return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
        }
        return numbers;
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

    // Extracted score calculation function
    const calculateScores = (timersData) => {
        let temp1 = 0;
        let temp2 = 0;

        for (let i = 0; i < timersData.length; i++) {
            const timer = timersData[i];
            const time1 = parseTimeToSeconds(timer.player1Time);
            const time2 = parseTimeToSeconds(timer.player2Time);

            if (
                (timer.player1Checks.timeExceeded && timer.player2Checks.timeExceeded) ||
                (timer.player1Checks.died && timer.player2Checks.died)
            ) {
                if (time1 > time2) {
                    temp2 += 1;
                } else {
                    temp1 += 1;
                }
                continue;
            }
            if (
                (timer.player1Checks.timeExceeded && !timer.player2Checks.timeExceeded) ||
                (timer.player1Checks.died && !timer.player2Checks.died) ||
                (time1 > time2 && !timer.player2Checks.timeExceeded && !timer.player2Checks.died)
            ) {
                temp2 += 1;
            } else {
                temp1 += 1;
            }
        }

        return { player1Score: temp1, player2Score: temp2 };
    };

    const handleTimeChange = (gameIndex, player, value) => {
        const newTimers = [...timers];
        const formattedValue = formatTimeInput(value);

        if (player === "player1") {
            newTimers[gameIndex].player1Time = formattedValue;
        } else {
            newTimers[gameIndex].player2Time = formattedValue;
        }

        setTimers(newTimers);
        updateGameWithTimers(gameIndex, newTimers[gameIndex]);
    };

    const handleTimeBlur = (gameIndex) => {
        const newTimers = [...timers];
        const timer = newTimers[gameIndex];

        if (timer.player1Time.length === 5) {
            let time1 = parseTimeToSeconds(timer.player1Time);
            newTimers[gameIndex].player1Time = formatSecondsToTime(time1);
        }

        if (timer.player2Time.length === 5) {
            let time2 = parseTimeToSeconds(timer.player2Time);
            newTimers[gameIndex].player2Time = formatSecondsToTime(time2);
        }

        if (timer.player1Time.length === 5 && timer.player2Time.length === 5) {
            const time1 = parseTimeToSeconds(timer.player1Time);
            const time2 = parseTimeToSeconds(timer.player2Time);

            const { player1Score, player2Score } = calculateScores(newTimers);
            updateState("player1Score", player1Score);
            updateState("player2Score", player2Score);

            const diffSeconds = Math.abs(time1 - time2);
            newTimers[gameIndex].difference = formatSecondsToTime(diffSeconds);
        } else {
            newTimers[gameIndex].difference = "00:00";
        }

        setTimers([...newTimers]);
        updateGameWithTimers(gameIndex, newTimers[gameIndex]);
    };

    const isTimeGreater = (gameIndex, player) => {
        const timer = timers[gameIndex];
        if (timer.player1Time.length !== 5 || timer.player2Time.length !== 5) return false;

        const time1 = parseTimeToSeconds(timer.player1Time);
        const time2 = parseTimeToSeconds(timer.player2Time);

        if (player === "player1") {
            return time1 > time2;
        } else {
            return time2 > time1;
        }
    };

    const handleCheckboxChange = (gameIndex, player, checkType, value) => {
        const newTimers = [...timers];
        const timer = newTimers[gameIndex];

        let penalty = getCurrentPenalty(checkType);
        if (!value) {
            penalty *= -1;
        }

        if (player === "player1") {
            newTimers[gameIndex].player1Checks[checkType] = value;
            const currentTime = parseTimeToSeconds(timer.player1Time);
            const newTime = currentTime + penalty;
            newTimers[gameIndex].player1Time = formatSecondsToTime(newTime);
        } else {
            newTimers[gameIndex].player2Checks[checkType] = value;
            const currentTime = parseTimeToSeconds(timer.player2Time);
            const newTime = currentTime + penalty;
            newTimers[gameIndex].player2Time = formatSecondsToTime(newTime);
        }

        if (timer.player1Time.length === 5 && timer.player2Time.length === 5) {
            const { player1Score, player2Score } = calculateScores(newTimers);
            updateState("player1Score", player1Score);
            updateState("player2Score", player2Score);

            const time1 = parseTimeToSeconds(timer.player1Time);
            const time2 = parseTimeToSeconds(timer.player2Time);
            const diffSeconds = Math.abs(time1 - time2);
            newTimers[gameIndex].difference = formatSecondsToTime(diffSeconds);
        } else {
            newTimers[gameIndex].difference = "00:00";
        }

        setTimers(newTimers);
        updateGameWithTimers(gameIndex, newTimers[gameIndex]);
    };

    const calculateTotals = () => {
        let totalPlayer1Seconds = 0;
        let totalPlayer2Seconds = 0;

        timers.forEach((timer) => {
            if (timer.player1Time.length === 5) {
                totalPlayer1Seconds += parseTimeToSeconds(timer.player1Time);
            }
            if (timer.player2Time.length === 5) {
                totalPlayer2Seconds += parseTimeToSeconds(timer.player2Time);
            }
        });

        const totalDifference = Math.abs(totalPlayer1Seconds - totalPlayer2Seconds);

        return {
            player1Time: formatSecondsToTime(totalPlayer1Seconds),
            player2Time: formatSecondsToTime(totalPlayer2Seconds),
            difference: formatSecondsToTime(totalDifference),
            player1Score,
            player2Score,
        };
    };

    const totals = calculateTotals();

    return (
        <div className={styles.timersWrapper}>
            <div className={styles.timersContent}>
                <div className={styles.names}>
                    <div className={styles.leftName}>{player1.display_name}</div>
                    <div className={styles.ggold}>VS</div>
                    <div className={styles.rightName}>{player2.display_name}</div>
                </div>
                <div className={styles.games}>
                    {games.map((game, i) => {
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
                                        value={timers[i]?.player1Time || ""}
                                        onChange={(e) => handleTimeChange(i, "player1", e.target.value)}
                                        onBlur={() => handleTimeBlur(i)}
                                        placeholder="00:00"
                                        maxLength={5}
                                        className={classNames(
                                            styles.timerInput,
                                            isTimeGreater(i, "player1") ? styles.redTimer : ""
                                        )}
                                        style={timers[i]?.player1Time ? {} : { textShadow: "none" }}
                                    />
                                    <div className={styles.vDivider}></div>
                                    <div className={styles.totalDifference}>{timers[i]?.difference}</div>
                                    <div className={styles.vDivider}></div>
                                    <input
                                        type="text"
                                        value={timers[i]?.player2Time || ""}
                                        onChange={(e) => handleTimeChange(i, "player2", e.target.value)}
                                        onBlur={() => handleTimeBlur(i)}
                                        placeholder="00:00"
                                        maxLength={5}
                                        className={classNames(
                                            styles.timerInput,
                                            isTimeGreater(i, "player2") ? styles.redTimer : ""
                                        )}
                                        style={timers[i]?.player2Time ? {} : { textShadow: "none" }}
                                    />
                                </div>
                                <div className={styles.checks}>
                                    <div className={styles.playerChecks}>
                                        <div className={styles.attempts}>
                                            {["attempt1", "attempt2", "attempt3"].map((attempt, idx) => (
                                                <label key={attempt}>
                                                    <input
                                                        className={styles.attemptLeftCheckbox}
                                                        type="checkbox"
                                                        checked={timers[i]?.player1Checks[attempt] || false}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(
                                                                i,
                                                                "player1",
                                                                attempt,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                        <div className={styles.redChecks}>
                                            <label className={styles.checkboxContainer}>
                                                <input
                                                    className={styles.diedLeftCheckbox}
                                                    type="checkbox"
                                                    checked={timers[i]?.player1Checks.died || false}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(i, "player1", "died", e.target.checked)
                                                    }
                                                />
                                                <FaSkull className={styles.skullIcon} />
                                            </label>
                                            <label className={styles.checkboxContainer}>
                                                <input
                                                    className={styles.diedLeftCheckbox}
                                                    type="checkbox"
                                                    checked={timers[i]?.player1Checks.timeExceeded || false}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(
                                                            i,
                                                            "player1",
                                                            "timeExceeded",
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <FaHourglass className={styles.skullIcon} />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <button type="button" className={styles.nextButton} onClick={handlePrevStep}>
                                            <div className={styles.hDivider}></div>
                                        </button>
                                    </div>
                                    <div className={styles.playerChecks}>
                                        <div className={styles.redChecks}>
                                            <label className={styles.checkboxContainer}>
                                                <input
                                                    className={styles.diedRightCheckbox}
                                                    type="checkbox"
                                                    checked={timers[i]?.player2Checks.timeExceeded || false}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(
                                                            i,
                                                            "player2",
                                                            "timeExceeded",
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <FaHourglass className={styles.skullIcon} />
                                            </label>
                                            <label className={styles.checkboxContainer}>
                                                <input
                                                    className={styles.diedRightCheckbox}
                                                    type="checkbox"
                                                    checked={timers[i]?.player2Checks.died || false}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(i, "player2", "died", e.target.checked)
                                                    }
                                                />
                                                <FaSkull className={styles.skullIcon} />
                                            </label>
                                        </div>
                                        <div className={styles.attempts}>
                                            {["attempt3", "attempt2", "attempt1"].map((attempt, idx) => (
                                                <label key={attempt}>
                                                    <input
                                                        className={styles.attemptRightCheckbox}
                                                        type="checkbox"
                                                        checked={timers[i]?.player2Checks[attempt] || false}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(
                                                                i,
                                                                "player2",
                                                                attempt,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {showTotal && (
                        <div className={styles.totalSection}>
                            <button type="button" onClick={handleSubmit} className={styles.titleGold}>
                                Total
                            </button>
                            <div className={styles.totalContainer}>
                                <div className={styles.totalTime}>
                                    <div>{totals.player1Time}</div>
                                    <p className={styles.ggold}>| {totals.player1Score}</p>
                                </div>
                                <div className={styles.totalDifference}>{totals.difference}</div>
                                <div className={styles.totalTime}>
                                    <p className={styles.ggold}>{totals.player2Score} |</p>
                                    <div>{totals.player2Time}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
