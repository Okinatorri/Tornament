import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../state-providers/UserContext";

import { FiLogOut } from "react-icons/fi";
import { FaTelegram } from "react-icons/fa";

import { api } from "../../api";

import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import styles from "./styles.module.scss";

const Header = () => {
    const { i18n } = useLingui();
    const [language, setLanguage] = useState(localStorage.getItem("language") || "en");

    useEffect(() => {
        localStorage.setItem("language", language);
        i18n.activate(language);
    }, [i18n, language]);

    const navigate = useNavigate();
    const location = useLocation();

    const activePath = location.pathname;

    const isActive = (path) => {
        if (path === "/") return activePath === path;
        return activePath.startsWith(path);
    };

    const { user, isLoading, checkAuth } = useUser();
    const isAdmin = user?.status === "admin";

    const handleLogout = async () => {
        try {
            await api.post("/logout", {});
            navigate("/about");
            checkAuth();
        } catch (e) {}
    };

    return (
        <header className={styles.appHeader}>
            <div className={styles.wrapper}>
                <h1 className={styles.name}>
                    Wuthering <br /> Waves
                </h1>
                <div className={styles.links}>
                    <button onClick={() => navigate("/about")} className={isActive("/about") ? styles.active : ""}>
                        <Trans>ABOUT</Trans>
                    </button>
                    <button onClick={() => navigate("/rules")} className={isActive("/rules") ? styles.active : ""}>
                        <Trans>RULES</Trans>
                    </button>
                    <button onClick={() => navigate("/bracket")} className={isActive("/bracket") ? styles.active : ""}>
                        <Trans>TOURNAMENT BRACKET</Trans>
                    </button>
                    <button onClick={() => navigate("/history")} className={isActive("/history") ? styles.active : ""}>
                        <Trans>HISTORY</Trans>
                    </button>
                    {!isLoading &&
                        (!user ? (
                            <button
                                onClick={() => navigate("/participate")}
                                className={isActive("/participate") ? styles.active : ""}
                            >
                                <Trans>PARTICIPATE</Trans>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate(`/player/${user.username}`)}
                                    className={isActive(`/player/${user.username}`) ? styles.active : ""}
                                >
                                    {user.display_name}
                                </button>
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => navigate("/admin")}
                                            className={isActive("/admin") ? styles.active : ""}
                                        >
                                            <Trans>ADMIN CONSOLE</Trans>
                                        </button>
                                        <button
                                            onClick={() => navigate("/settings")}
                                            className={isActive("/settings") ? styles.active : ""}
                                        >
                                            <Trans>SETTINGS</Trans>
                                        </button>
                                    </>
                                )}
                            </>
                        ))}
                </div>
                <div className={styles.infoContainer}>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className={styles.logoutButton}
                            style={{ display: "flex", justifyContent: "center" }}
                            title="Logout"
                        >
                            <FiLogOut className={styles.logoutIcon} />
                        </button>
                    )}
                    <div className={styles.languageSwitcher}>
                        <button onClick={() => setLanguage("en")} className={styles.langButton}>
                            EN
                        </button>
                        <button onClick={() => setLanguage("ru")} className={styles.langButton}>
                            RU
                        </button>
                    </div>
                    @zymer44
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <FaTelegram className={styles.icon} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
