import React, { useState } from "react";
import { useAdmin } from "../../../state-providers/AdminContext";
import { usePickBansState } from "./state";

import Item from "../../../components/Item";
import SkeletonItem from "../../../components/SkeletonItem";

import classNames from "classnames";
import styles from "./styles.module.scss";

export const PickBansStep = () => {
    const {
        nextStep,
        players: { player1, player2 },
        galograms: { player1Ban, player2Ban, player1Choose, player2Choose, random },
        games,
        addGame,
        immunityCharacters,
        bannedCharacters,
        player1Score,
        player2Score,
        updateState,
    } = useAdmin();

    const [player1Bans, setPlayer1Bans] = useState([null]);
    const [player2Bans, setPlayer2Bans] = useState([null]);
    const [player1Picks, setPlayer1Picks] = useState([null, null, null]);
    const [player2Picks, setPlayer2Picks] = useState([null, null, null]);
    const [disabledPlayer1Characters, setDisabledPlayer1Characters] = useState([]);
    const [disabledPlayer2Characters, setDisabledPlayer2Characters] = useState([]);

    const [immunityDropdown, setImmunityDropdown] = useState(false);
    const [bannedDropdown, setBannedDropdown] = useState(false);

    const { player1Characters, player2Characters, uniqueCharacters, isLoading } = usePickBansState(
        player1.username,
        player2.username
    );

    const shouldSwap = games.length % 2 !== 0;

    const displayedPlayer1 = shouldSwap ? player2 : player1;
    const displayedPlayer2 = shouldSwap ? player1 : player2;
    const displayedPlayer1Ban = shouldSwap ? player2Ban : player1Ban;
    const displayedPlayer2Ban = shouldSwap ? player1Ban : player2Ban;
    const displayedPlayer1Picks = shouldSwap ? player2Picks : player1Picks;
    const displayedPlayer2Picks = shouldSwap ? player1Picks : player2Picks;
    const displayedPlayer1Bans = shouldSwap ? player2Bans : player1Bans;
    const displayedPlayer2Bans = shouldSwap ? player1Bans : player2Bans;

    const displayedPlayer1Score = shouldSwap ? player2Score : player1Score;
    const displayedPlayer2Score = shouldSwap ? player1Score : player2Score;

    const handleAddImmunity = (item) => {
        updateState("immunityCharacters", [...immunityCharacters, item]);
        setImmunityDropdown(false);
    };

    const handleAddBanned = (item) => {
        updateState("bannedCharacters", [...bannedCharacters, item]);
        setBannedDropdown(false);
    };

    const handleRemoveBanned = (item) => {
        const newData = bannedCharacters.filter((c) => c.name !== item.name);
        updateState("bannedCharacters", newData);
    };

    const handleRemoveImmunity = (item) => {
        const newData = immunityCharacters.filter((c) => c.name !== item.name);
        updateState("immunityCharacters", newData);
    };

    const availableImmunityCharacters = (uniqueCharacters || []).filter(
        (ch) => !immunityCharacters.some((ic) => ic.name === ch.name)
    );

    const availableBannedCharacters = (uniqueCharacters || []).filter(
        (ch) => !bannedCharacters.some((bc) => bc.name === ch.name)
    );

    const handleCharacterClick = (character, player) => {
        const isImmune = immunityCharacters.some((ic) => character.name.toLowerCase().includes(ic.name.toLowerCase()));

        if (player === "player1") {
            if (disabledPlayer1Characters.includes(character.name)) {
                return;
            }
            if (player1Bans.filter(Boolean).length < 1) {
                let emptyIndex = -1;
                if (shouldSwap) {
                    emptyIndex = player1Bans.findIndex((ban) => ban === null);
                } else {
                    for (let i = player1Bans.length - 1; i >= 0; i--) {
                        if (player1Bans[i] === null) {
                            emptyIndex = i;
                            break;
                        }
                    }
                }
                setPlayer1Bans((prev) => {
                    const newBans = [...prev];
                    if (emptyIndex !== -1) {
                        newBans[emptyIndex] = character.name;
                    }
                    return newBans;
                });
                setDisabledPlayer1Characters((prev) => [...prev, character.name]);
                setDisabledPlayer2Characters((prev) => [...prev, character.name]);
            }
            // Next 3 clicks - pick characters
            else if (player1Picks.filter(Boolean).length < 3) {
                let emptyIndex = -1;
                if (shouldSwap) {
                    emptyIndex = player1Picks.findIndex((pick) => pick === null);
                } else {
                    for (let i = player1Picks.length - 1; i >= 0; i--) {
                        if (player1Picks[i] === null) {
                            emptyIndex = i;
                            break;
                        }
                    }
                }
                setPlayer1Picks((prev) => {
                    const newPicks = [...prev];
                    if (emptyIndex !== -1) {
                        newPicks[emptyIndex] = character;
                    } else {
                        newPicks.push(character);
                    }
                    return newPicks;
                });
                setDisabledPlayer1Characters((prev) => [...prev, character.name]);
                if (!isImmune) {
                    setDisabledPlayer2Characters((prev) => [...prev, character.name]);
                }
            }
        } else if (player === "player2") {
            if (disabledPlayer2Characters.includes(character.name)) {
                return;
            }
            // First two clicks - ban characters
            if (player2Bans.filter(Boolean).length < 1) {
                let emptyIndex = -1;
                if (shouldSwap) {
                    for (let i = player2Bans.length - 1; i >= 0; i--) {
                        if (player2Bans[i] === null) {
                            emptyIndex = i;
                            break;
                        }
                    }
                } else {
                    emptyIndex = player2Bans.findIndex((ban) => ban === null);
                }
                setPlayer2Bans((prev) => {
                    const newBans = [...prev];
                    if (emptyIndex !== -1) {
                        newBans[emptyIndex] = character.name;
                    }
                    return newBans;
                });
                setDisabledPlayer1Characters((prev) => [...prev, character.name]);
                setDisabledPlayer2Characters((prev) => [...prev, character.name]);
            }
            // Next 3 clicks - pick characters
            else if (player2Picks.filter(Boolean).length < 3) {
                let emptyIndex = -1;
                if (shouldSwap) {
                    for (let i = player2Picks.length - 1; i >= 0; i--) {
                        if (player2Picks[i] === null) {
                            emptyIndex = i;
                            break;
                        }
                    }
                } else {
                    emptyIndex = player2Picks.findIndex((pick) => pick === null);
                }
                setPlayer2Picks((prev) => {
                    const newPicks = [...prev];
                    if (emptyIndex !== -1) {
                        newPicks[emptyIndex] = character;
                    } else {
                        newPicks.push(character);
                    }
                    return newPicks;
                });
                setDisabledPlayer2Characters((prev) => [...prev, character.name]);
                if (!isImmune) {
                    setDisabledPlayer1Characters((prev) => [...prev, character.name]);
                }
            }
        }
    };

    const removePick = (character, player) => {
        if (!character) return;

        const isImmune = immunityCharacters.some((ic) => character.name.toLowerCase().includes(ic.name.toLowerCase()));

        if (player === "player1") {
            setPlayer1Picks((prev) => {
                const newPicks = [...prev];
                const index = newPicks.findIndex((c) => c?.name === character.name);
                if (index !== -1) {
                    newPicks[index] = null; // Устанавливаем null вместо удаления
                }
                return newPicks;
            });
            setDisabledPlayer1Characters((prev) => prev.filter((c) => c !== character.name));
            if (!isImmune) {
                setDisabledPlayer2Characters((prev) => prev.filter((c) => c !== character.name));
            }
        } else {
            setPlayer2Picks((prev) => {
                const newPicks = [...prev];
                const index = newPicks.findIndex((c) => c?.name === character.name);
                if (index !== -1) {
                    newPicks[index] = null; // Устанавливаем null вместо удаления
                }
                return newPicks;
            });
            setDisabledPlayer2Characters((prev) => prev.filter((c) => c !== character.name));
            if (!isImmune) {
                setDisabledPlayer1Characters((prev) => prev.filter((c) => c !== character.name));
            }
        }
    };

    const removeBan = (character, i, player) => {
        if (player === "player1") {
            setPlayer1Bans((prev) => {
                const newBans = [...prev];
                newBans[i] = null;
                return newBans;
            });
            setDisabledPlayer1Characters((prev) => prev.filter((c) => c !== character));
            setDisabledPlayer2Characters((prev) => prev.filter((c) => c !== character));
        } else {
            setPlayer2Bans((prev) => {
                const newBans = [...prev];
                newBans[i] = null;
                return newBans;
            });
            setDisabledPlayer1Characters((prev) => prev.filter((c) => c !== character));
            setDisabledPlayer2Characters((prev) => prev.filter((c) => c !== character));
        }
    };

    const handleNextStep = () => {
        addGame({ player1Picks, player2Picks, player1Bans, player2Bans });
        nextStep();
    };

    return (
        <div className={styles.galogramsContent}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className={styles.playerNames}>
                    <div
                        className={styles.titlePurple}
                        style={{ position: "absolute", left: 0, top: "25px", fontSize: "31px" }}
                    >
                        {displayedPlayer1.display_name}
                    </div>
                    <div
                        className={styles.titlePurple}
                        style={{ position: "absolute", right: 0, top: "25px", fontSize: "31px" }}
                    >
                        {displayedPlayer2.display_name}
                    </div>
                </div>
                <div className={styles.bans}>
                    <div className={styles.bansContainer}>
                        <div style={{ display: "flex", gap: "20px" }}>
                            <Item
                                key={displayedPlayer1Ban}
                                showTrash={false}
                                canEdit={false}
                                showStats={false}
                                type="galogram"
                                name={displayedPlayer1Ban}
                                rarity={0}
                            />
                            {[...Array(1)].map((_, i) => {
                                const ban = displayedPlayer2Bans[i] || "";
                                const placeholderValues = [1];
                                return (
                                    <Item
                                        key={`player2-ban-${i}`}
                                        showTrash={false}
                                        canEdit={false}
                                        showStats={false}
                                        type="character"
                                        name={ban}
                                        onAddClick={() => removeBan(ban, i, shouldSwap ? "player1" : "player2")}
                                        rarity={0}
                                        placeholder={placeholderValues[i]}
                                    />
                                );
                            })}
                        </div>
                        <h3 className={styles.titleRed}>bans</h3>
                        <div style={{ display: "flex", gap: "20px" }}>
                            {[...Array(1)].map((_, i) => {
                                const ban = displayedPlayer1Bans[i] || "";
                                const placeholderValues = [2];
                                return (
                                    <Item
                                        key={`player1-ban-${i}`}
                                        showTrash={false}
                                        canEdit={false}
                                        showStats={false}
                                        type="character"
                                        name={ban}
                                        onAddClick={() => removeBan(ban, i, shouldSwap ? "player2" : "player1")}
                                        rarity={0}
                                        placeholder={placeholderValues[i]}
                                    />
                                );
                            })}
                            <Item
                                key={displayedPlayer2Ban}
                                showTrash={false}
                                canEdit={false}
                                showStats={false}
                                type="galogram"
                                name={displayedPlayer2Ban}
                                rarity={0}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.picks}>
                    <div style={{ display: "flex", gap: "20px" }}>
                        {/* <Item
                            key={displayedPlayer1Choose}
                            showTrash={false}
                            canEdit={false}
                            showStats={false}
                            type="galogram"
                            name={displayedPlayer1Choose}
                            rarity={5}
                        /> */}
                        {[...Array(3)].map((_, i) => {
                            const pick = displayedPlayer1Picks[i] || {};
                            const placeholderValues = [7, 6, 3];
                            return (
                                <Item
                                    key={`player1-${pick?.name}-${i}`}
                                    showTrash={false}
                                    canEdit={false}
                                    showStats={false}
                                    type="character"
                                    name={pick?.name}
                                    onAddClick={() => pick.name && removePick(pick, "player1")}
                                    placeholder={placeholderValues[i]}
                                />
                            );
                        })}
                    </div>
                    <h3 className={styles.titlePurple}>picks</h3>
                    <div style={{ display: "flex", gap: "20px" }}>
                        {[...Array(3)].map((_, i) => {
                            const pick = displayedPlayer2Picks[i] || {};
                            const placeholderValues = [4, 5, 8];
                            return (
                                <Item
                                    key={`player2-${pick?.name}-${i}`}
                                    showTrash={false}
                                    canEdit={false}
                                    showStats={false}
                                    type="character"
                                    name={pick?.name}
                                    onAddClick={() => pick.name && removePick(pick, "player2")}
                                    placeholder={placeholderValues[i]}
                                />
                            );
                        })}
                        {/* <Item
                            key={displayedPlayer2Choose}
                            showTrash={false}
                            canEdit={false}
                            showStats={false}
                            type="galogram"
                            name={displayedPlayer2Choose}
                            rarity={5}
                        /> */}
                    </div>
                </div>
                <div className={styles.game}>
                    <div className={styles.scoreBars}>
                        <div className={classNames(styles.bar, displayedPlayer1Score >= 2 && styles.filled)}></div>
                        <div className={classNames(styles.bar, displayedPlayer1Score >= 1 && styles.filled)}></div>
                    </div>
                    <button
                        type="button"
                        className={classNames(styles.nextButton, styles.titleGold)}
                        onClick={handleNextStep}
                    >
                        Game {games.length + 1}
                    </button>
                    <div className={styles.scoreBars}>
                        <div className={classNames(styles.bar, displayedPlayer2Score >= 1 && styles.filled)}></div>
                        <div className={classNames(styles.bar, displayedPlayer2Score >= 2 && styles.filled)}></div>
                    </div>
                </div>
                <div className={styles.chars}>
                    <div className={styles.playerChars}>
                        {isLoading
                            ? Array(10)
                                  .fill(0)
                                  .map((_, i) => <SkeletonItem key={`skeleton-${i}`} />)
                            : (shouldSwap ? player2Characters : player1Characters).map((ch, i) => (
                                  <Item
                                      key={`player1${ch.name}${i}`}
                                      showTrash={false}
                                      canEdit={false}
                                      type="character"
                                      name={ch.name}
                                      value1={ch.value1}
                                      value2={ch.value2}
                                      onAddClick={() => handleCharacterClick(ch, shouldSwap ? "player2" : "player1")}
                                      disabled={
                                          (shouldSwap ? disabledPlayer2Characters : disabledPlayer1Characters).includes(
                                              ch.name
                                          ) || bannedCharacters.some((bc) => bc.name === ch.name)
                                      }
                                  />
                              ))}
                    </div>
                    <div className={styles.chsrsGal}>
                        <Item
                            key={`${player1Choose}1`}
                            showTrash={false}
                            canEdit={false}
                            showStats={false}
                            type="galogram"
                            name={player1Choose}
                            rarity={5}
                            disabled={games.length >= 1}
                        />
                        <Item
                            key={`${player2Choose}2`}
                            showTrash={false}
                            canEdit={false}
                            showStats={false}
                            type="galogram"
                            name={player2Choose}
                            rarity={5}
                            disabled={games.length >= 2}
                        />
                        <Item
                            key={random}
                            showTrash={false}
                            canEdit={false}
                            showStats={false}
                            type="galogram"
                            name={random}
                            rarity={5}
                        />
                    </div>
                    <div className={styles.playerChars} style={{ justifyContent: "flex-end" }}>
                        {(shouldSwap ? player1Characters : player2Characters).map((ch, i) => (
                            <Item
                                key={`player2${ch.name}${i}`}
                                showTrash={false}
                                canEdit={false}
                                type="character"
                                name={ch.name}
                                value1={ch.value1}
                                value2={ch.value2}
                                onAddClick={() => handleCharacterClick(ch, shouldSwap ? "player1" : "player2")}
                                disabled={
                                    (shouldSwap ? disabledPlayer1Characters : disabledPlayer2Characters).includes(
                                        ch.name
                                    ) || bannedCharacters.some((bc) => bc.name === ch.name)
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.bottom}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                    <p className={styles.subtitlePurple}>immunity</p>
                    <div className={styles.playerTable} style={{ justifyContent: "flex-end" }}>
                        <div className={styles.addButtonContainer}>
                            <Item isAddButton onAddClick={() => setImmunityDropdown((prev) => !prev)} />
                            {immunityDropdown && (
                                <div className={styles.dropdownLeft}>
                                    {availableImmunityCharacters.map((item, i) => (
                                        <Item
                                            showStats={false}
                                            key={`${item.name}${i}`}
                                            type="character"
                                            name={item.name}
                                            showTrash={false}
                                            onAddClick={() => handleAddImmunity(item)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {immunityCharacters.map((ch, i) => (
                            <Item
                                key={`${ch.name}${i}`}
                                showTrash={false}
                                showStats={false}
                                canEdit={false}
                                type="character"
                                name={ch.name}
                                value1={ch.value1}
                                value2={ch.value2}
                                onAddClick={() => handleRemoveImmunity(ch)}
                            />
                        ))}
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p className={styles.subtitleRed} style={{ paddingLeft: "16px" }}>
                        banned
                    </p>
                    <div className={styles.playerTable}>
                        {bannedCharacters.map((ch, i) => (
                            <Item
                                key={`${ch.name}${i}`}
                                showTrash={false}
                                showStats={false}
                                canEdit={false}
                                type="character"
                                name={ch.name}
                                value1={ch.value1}
                                value2={ch.value2}
                                rarity={0}
                                onAddClick={() => handleRemoveBanned(ch)}
                            />
                        ))}
                        <div className={styles.addButtonContainer}>
                            <Item rarity={0} isAddButton onAddClick={() => setBannedDropdown((prev) => !prev)} />
                            {bannedDropdown && (
                                <div className={styles.dropdownRight}>
                                    {availableBannedCharacters.map((item, i) => (
                                        <Item
                                            showStats={false}
                                            key={`${item.name}${i}`}
                                            type="character"
                                            name={item.name}
                                            showTrash={false}
                                            rarity={0}
                                            onAddClick={() => handleAddBanned(item)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
