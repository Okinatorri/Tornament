import React from "react";

import Header from "../../components/Header";
import TwitchStreamers from "../../components/TwitchStreamers";

import { Trans } from "@lingui/react/macro";

import styles from "./styles.module.scss";

const NotAuth = () => {
    return (
        <div className={styles.notAuthContainer}>
            <Header />
            <div className={styles.notAuthContent}>
                <p>
                    <Trans>You don't have permissions for this page</Trans>
                </p>
            </div>
            <div style={{ zIndex: 1 }}>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default NotAuth;
