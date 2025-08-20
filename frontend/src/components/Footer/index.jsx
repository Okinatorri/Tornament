import React from "react";

import { useLingui } from "@lingui/react/macro";

import styles from "./styles.module.scss";

const Footer = () => {
    const { t } = useLingui();

    const items = [{ name: t`prize money`, price: 200 }];

    return (
        <footer className={styles.footerContainer}>
            <div className={styles.items}>
                {items.map((item, i) => (
                    <p key={i}>
                        {item.name} - {item.price}$
                    </p>
                ))}
            </div>
        </footer>
    );
};

export default Footer;
