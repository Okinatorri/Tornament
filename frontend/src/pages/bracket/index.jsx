import React from "react";
import { Bracket, Seed, SeedItem, SeedTeam } from "react-brackets";

import { Trans } from "@lingui/react/macro";

import Header from "../../components/Header";
import TwitchStreamers from "../../components/TwitchStreamers";

import { useBracketState } from "./state";

import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";

const CustomSeed = ({ seed, title, breakpoint, roundIndex, seedIndex }) => {
    const handlePlayerClick = (nickname) => {
        if (nickname && nickname !== "-") {
            seed.navigate(`/player/${encodeURIComponent(nickname)}`);
        }
    };

    const homeTeam = seed.teams[0];
    const awayTeam = seed.teams[1];

    return (
        <Seed mobileBreakpoint={breakpoint}>
            <SeedItem>
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
                        <div
                            style={{
                                cursor:
                                    homeTeam?.player?.username && homeTeam?.player?.username !== "-"
                                        ? "pointer"
                                        : "default",
                            }}
                            onClick={() => handlePlayerClick(homeTeam.player.username)}
                        >
                            {homeTeam?.player?.display_name || "-"}
                        </div>
                    </SeedTeam>
                    <SeedTeam
                        style={{
                            backgroundColor:
                                homeTeam.score < awayTeam.score && awayTeam?.player?.username !== "-"
                                    ? "rgb(7 106 0)"
                                    : "transparent",
                            cursor:
                                awayTeam?.player?.username && awayTeam?.player?.username !== "-"
                                    ? "pointer"
                                    : "default",
                        }}
                    >
                        <div>{awayTeam.score}</div>
                        <div onClick={() => handlePlayerClick(awayTeam.player.username)}>
                            {awayTeam?.player?.display_name || "-"}
                        </div>
                    </SeedTeam>
                </div>
            </SeedItem>
        </Seed>
    );
};

const Brackets = () => {
    const { rounds, isNoActive } = useBracketState();
    const navigate = useNavigate();

    return (
        <div className={styles.bracketContainer}>
            <Header />
            {isNoActive ? (
                <div className={styles.noActiveContent}>
                    <p className={styles.noActiveText}>
                        <Trans>Currently there are no active tournaments</Trans>
                    </p>
                    <button className={styles.historyButton} onClick={() => navigate("/history")}>
                        <Trans>View Tournament History</Trans>
                    </button>
                </div>
            ) : (
                <div className={styles.bracketContent}>
                    <Bracket rounds={rounds} renderSeedComponent={CustomSeed} />
                </div>
            )}
            <div className={styles.streamers}>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default Brackets;
