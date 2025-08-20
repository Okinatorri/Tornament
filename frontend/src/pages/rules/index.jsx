import React from "react";
import Header from "../../components/Header";
import Button from "../../components/Button";
import TwitchStreamers from "../../components/TwitchStreamers";
import { Trans, useLingui } from "@lingui/react/macro";
import styles from "./styles.module.scss";
import {
    GOOGLE_DOC_REGLAMENT_EN,
    GOOGLE_DOC_REGLAMENT_RU,
    GOOGLE_REGISTRATION_FORM,
    TWITCH_MALIWAN,
    TWITCH_MIROICHII,
} from "../../constants";

const Rules = () => {
    const { i18n } = useLingui();
    const reglamentLink = i18n.locale === "en" ? GOOGLE_DOC_REGLAMENT_EN : GOOGLE_DOC_REGLAMENT_RU;

    const handleButtonClick = () => {
        window.open(reglamentLink, "_blank");
    };

    return (
        <div className={styles.rulesContainer}>
            <Header />
            <div className={styles.rulesContent}>
                <div className={styles.rulesTable}>
                    <h3>
                        <Trans>Required conditions for participation in the tournament:</Trans>
                    </h3>
                    <ul>
                        <li>
                            <Trans>Union level (UL) 70+.</Trans>
                        </li>
                        <li>
                            <Trans>
                                The tournament is held in the Tempest Cup Discord server. Minimum stream quality: 720p
                            </Trans>
                        </li>
                        <li>
                            <Trans>Participation from mobile devices is not allowed.</Trans>
                        </li>
                        <li>
                            <Trans>
                                After successful registration account cannot be changed and transferred between
                                participants within one tournament.
                            </Trans>
                        </li>
                    </ul>

                    <h3>
                        <Trans>Applying for participation:</Trans>
                    </h3>
                    <ul>
                        <li>
                            <Trans>
                                Fill the{" "}
                                <a href={GOOGLE_REGISTRATION_FORM} target="_blank">
                                    Google-form
                                </a>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                Upload screenshots from the game to Google form, combining them into one file in PDF
                                format (screenshots of all Echo sets from presets on MainDD and Sub DD)
                            </Trans>
                        </li>
                        <li>
                            <Trans>Apply for Participation</Trans>
                        </li>
                        <li>
                            <Trans>
                                If your application is approved, you will be given an account to sing in the Tempest Cup
                                tournament website
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                After successful login, in the PARTICIPATE tab you need to add all the characters you
                                plan to play (character level, number of chains), as well as weapons (level, rank),
                                click the "Sent" button
                            </Trans>
                        </li>
                    </ul>

                    <p>
                        <Trans>Different pairs of players will be broadcast simultaneously on Twitch channels:</Trans>
                        <br />
                        Miroichi{" "}
                        <a href={TWITCH_MIROICHII} target="_blank">
                            ({TWITCH_MIROICHII})
                        </a>
                        <br />
                        Maliwan{" "}
                        <a href={TWITCH_MALIWAN} target="_blank">
                            ({TWITCH_MALIWAN})
                        </a>{" "}
                    </p>
                </div>

                <div>
                    <Button onClick={handleButtonClick} className={styles.rulesBtn}>
                        <Trans>RULES</Trans>
                    </Button>
                </div>

                <div className={styles.rulesTable}>
                    <h3>
                        <Trans>Matches conduct:</Trans>
                    </h3>
                    <ul>
                        <li>
                            <Trans>
                                The first player in a pair is determined by a bot in Discord with the command "/coin" in
                                the voice channel chat;
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                The first player starts screen sharing in the designated Discord voice channel and
                                initiates the round. The organizer will provide instructions;
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                At the start of each match, players take turns banning one hologram and picking one for
                                Round 1 and Round 2;
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                The third hologram is chosen randomly from the remaining two and played in case of a 1-1
                                score;
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                At the beginning of each round, players alternate banning and picking characters from
                                their account pool. This ban-pick phase resets each round;
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                Players may not pick previously banned or used (non-immune) characters within the same
                                round. Rover (Spectro, Havoc, Aero) are treated as separate characters
                            </Trans>
                        </li>
                        <li>
                            <Trans>Players may restart the fight up to three times per round:</Trans>
                            <ul>
                                <li>
                                    <Trans>1st restart — free</Trans>
                                </li>
                                <li>
                                    <Trans>2nd restart — +5 seconds</Trans>
                                </li>
                                <li>
                                    <Trans>3rd restart — +10 seconds</Trans>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <Trans>The winner is the player who defeats the hologram twice in the shortest time;</Trans>
                        </li>
                    </ul>
                </div>
            </div>
            <div>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default Rules;
