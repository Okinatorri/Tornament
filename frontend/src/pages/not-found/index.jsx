import React from "react";

import Header from "../../components/Header";
import TwitchStreamers from "../../components/TwitchStreamers";

import { Trans } from "@lingui/react/macro";

import styles from "./styles.module.scss";

const NotFound = () => {
    return (
        <div className={styles.notFoundContainer}>
            <Header />
            <div className={styles.notFoundContent}>
                <p>
                    <Trans>Page not found</Trans>
                </p>
            </div>
            <div style={{ zIndex: 1 }}>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default NotFound;
