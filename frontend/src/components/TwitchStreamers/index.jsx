import React from "react";

import twitchImg from "../../images/twitch.png";

import { TWITCH_MALIWAN, TWITCH_MIROICHII } from "../../constants";

import styles from "./styles.module.scss";

const TwitchStreamers = () => {
    return (
        <div className={styles.container}>
            <img style={{ width: "50px", height: "50px" }} src={twitchImg} alt="" />
            <div className={styles.streamers}>
                <a className={styles.firstName} href={TWITCH_MIROICHII} target="_blank">
                    miroichii
                </a>
                <br />
                <a className={styles.secondName} href={TWITCH_MALIWAN} target="_blank">
                    maliwan
                </a>
            </div>
        </div>
    );
};

export default TwitchStreamers;
