import React, { useState } from "react";
import { useAdmin } from "../../../state-providers/AdminContext";
import { useGalogramsState } from "./state";

import { galogramsData } from "../../../constants/videoImports";

import PlayerSelect from "../../../components/PlayerSelect";
import Item from "../../../components/Item";

import styles from "./styles.module.scss";
import Button from "../../../components/Button";

export const GalogramsStep = () => {
    const {
        nextStep,
        players: { player1, player2 },
        galograms: { player1Ban, player2Ban, player1Choose, player2Choose, random },
        updateState,
        resetState,
    } = useAdmin();

    const { players, bannedCharacters } = useGalogramsState();
    const [clickCount, setClickCount] = useState(0);
    const [lastSelectedId, setLastSelectedId] = useState(null);

    const filteredFirstPlayers = players.filter((p) => !player2 || p.username !== player2.username);
    const filteredSecondPlayers = players.filter((p) => !player1 || p.username !== player1.username);

    const handleFirstPlayerSelect = (player) => {
        updateState("players.player1", player);
    };

    const handleSecondPlayerSelect = (player) => {
        updateState("players.player2", player);
    };

    const handleVideoClick = (videoId) => {
        if (random && videoId === random) {
            updateState("galograms.random", null);
            setLastSelectedId(player2Choose);
            return;
        }

        if (random) return;

        if (videoId === lastSelectedId) {
            switch (clickCount) {
                case 1:
                    updateState("galograms.player1Ban", null);
                    setClickCount(0);
                    setLastSelectedId(null);
                    break;
                case 2:
                    updateState("galograms.player2Ban", null);
                    setClickCount(1);
                    setLastSelectedId(player1Ban);
                    break;
                case 3:
                    updateState("galograms.player1Choose", null);
                    setClickCount(2);
                    setLastSelectedId(player2Ban);
                    break;
                case 4:
                    updateState("galograms.player2Choose", null);
                    setClickCount(3);
                    setLastSelectedId(player1Choose);
                    break;
                default:
                    break;
            }
            return;
        }

        switch (clickCount) {
            case 0:
                updateState("galograms.player1Ban", videoId);
                setClickCount(1);
                setLastSelectedId(videoId);
                break;
            case 1:
                updateState("galograms.player2Ban", videoId);
                setClickCount(2);
                setLastSelectedId(videoId);
                break;
            case 2:
                updateState("galograms.player1Choose", videoId);
                setClickCount(3);
                setLastSelectedId(videoId);
                break;
            case 3:
                updateState("galograms.player2Choose", videoId);
                setClickCount(4);
                setLastSelectedId(videoId);
                break;
            default:
                break;
        }
    };

    const handleRandomSelect = () => {
        if (clickCount < 4) return;

        const selected = [player1Ban, player2Ban, player1Choose, player2Choose].filter(Boolean);

        const available = galogramsData.filter((g) => !selected.includes(g.id));

        if (available.length > 0) {
            const randomIndex = Math.floor(Math.random() * available.length);
            const randomId = available[randomIndex]?.id;
            updateState("galograms.random", randomId);
            setLastSelectedId(randomId);
        }
    };

    const handleReset = () => {
        resetState();
        setClickCount(0);
        setLastSelectedId(null);
    };

    const getSelectionType = (id) => {
        if (id === player1Ban || id === player2Ban) return "banned";
        if (id === player1Choose || id === player2Choose || id === random) return "choosed";
        return null;
    };

    return (
        <div className={styles.galogramsContent}>
            <div className={styles.videoContent}>
                {galogramsData.map(({ id, video, element }) => {
                    const selectionType = getSelectionType(id);

                    return (
                        <div
                            key={id}
                            className={`${styles.videoContainer} ${
                                selectionType === "choosed" ? styles.choosedSelected : ""
                            } ${selectionType === "banned" ? styles.bannedSelected : ""}`}
                            onClick={() => handleVideoClick(id)}
                        >
                            <video src={video} autoPlay={selectionType !== "banned"} controls={false} loop muted />
                            <img className={styles.element} src={element} alt="" />
                        </div>
                    );
                })}
            </div>
            <div className={styles.buttonsContainer}>
                <div className={styles.names}>
                    <PlayerSelect
                        options={filteredFirstPlayers}
                        value={players}
                        onChange={handleFirstPlayerSelect}
                        placeholder=""
                        fontSize={28}
                    />
                    <div className={styles.vDivider}></div>
                    <div className={styles.ggold}>VS</div>
                    <div className={styles.vDivider}></div>
                    <PlayerSelect
                        options={filteredSecondPlayers}
                        value={players}
                        onChange={handleSecondPlayerSelect}
                        placeholder=""
                        fontSize={28}
                    />
                </div>
                <div className={styles.bans}>
                    <div className={styles.banChars}>
                        {bannedCharacters.map((ch, i) => (
                            <Item
                                key={`banned${i}`}
                                showTrash={false}
                                showStats={false}
                                canEdit={false}
                                type="character"
                                name={ch.name}
                                value1={ch.value1}
                                value2={ch.value2}
                                rarity={0}
                            />
                        ))}
                    </div>
                </div>
                <button disabled={!player1 || !player2} type="button" className={styles.nextButton} onClick={nextStep}>
                    <div className={styles.hDivider}></div>
                </button>
                <Button disabled={clickCount < 4 || !!random} onClick={handleRandomSelect} className={styles.rulesBtn}>
                    Random Select
                </Button>
                <Button onClick={handleReset} className={styles.rulesBtn}>
                    Reset All
                </Button>
            </div>
        </div>
    );
};
