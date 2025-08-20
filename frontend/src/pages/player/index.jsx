import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { FiTrash2, FiUpload } from "react-icons/fi";

import Header from "../../components/Header";
import Button from "../../components/Button";
import Item from "../../components/Item";
import SkeletonItem from "../../components/SkeletonItem";
import TwitchStreamers from "../../components/TwitchStreamers";

import { getActiveTournament, getPlayer, updateDisplayName } from "../../api";

import { Trans } from "@lingui/react/macro";

import { useUser } from "../../state-providers/UserContext";
import { useCharactersState } from "./charactersState";
import { useWeaponsState } from "./weaponsState";
import { useScreenshotsState } from "./screenshotsState";

import styles from "./styles.module.scss";

const Player = () => {
    const { nickname } = useParams();
    const { user, checkAuth } = useUser();

    const fileInputRef = useRef(null);

    const isAdmin = user?.status === "admin";

    const [isTournamentStarted, setIsTournamentStarted] = useState(true);
    const canEdit = isAdmin || (nickname === user?.username && !isTournamentStarted);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    const { state: charactersState, actions: charactersActions } = useCharactersState(nickname);

    const { state: weaponsState, actions: weaponsActions } = useWeaponsState(nickname);

    const { state: screenshotsState, actions: screenshotsActions } = useScreenshotsState(nickname);

    const [displayName, setDisplayName] = useState(user?.display_name || "");
    const [initialDisplayName, setInitialDisplayName] = useState(user?.display_name || "");

    const [characterSearch, setCharacterSearch] = useState("");
    const [weaponSearch, setWeaponSearch] = useState("");

    const filteredCharacterItems = charactersState.dropdownItems.filter((item) =>
        item.name.toLowerCase().includes(characterSearch.toLowerCase())
    );

    const filteredWeaponItems = weaponsState.dropdownItems.filter((item) =>
        item.name.toLowerCase().includes(weaponSearch.toLowerCase())
    );

    const [currentUser, setCurrentUser] = useState("");

    // SCREENSHOT
    const isScreenShots = false; // ВКЛЮЧИТЬ СКРИНШОТЫ

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);

    const openModal = (index) => {
        setCurrentScreenshotIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const nextScreenshot = () => {
        setCurrentScreenshotIndex((prev) => (prev + 1) % screenshotsState.screenshots.length);
    };

    const prevScreenshot = () => {
        setCurrentScreenshotIndex(
            (prev) => (prev - 1 + screenshotsState.screenshots.length) % screenshotsState.screenshots.length
        );
    };

    useEffect(() => {
        const hasChanges = displayName !== initialDisplayName || charactersState.hasChanges || weaponsState.hasChanges;
        setIsSaveDisabled(!hasChanges);
    }, [displayName, initialDisplayName, charactersState.hasChanges, weaponsState.hasChanges]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // const [charsRes, weaponsRes, screenRes, tournamentRes, curUserRes] = await Promise.all([
                //     charactersActions.loadCharacters(),
                //     weaponsActions.loadWeapons(),
                //     screenshotsActions.loadScreenshots(),
                //     getActiveTournament(),
                //     getPlayer(nickname),
                // ]);
                const [charsRes, weaponsRes, tournamentRes, curUserRes] = await Promise.all([
                    charactersActions.loadCharacters(),
                    weaponsActions.loadWeapons(),
                    getActiveTournament(),
                    getPlayer(nickname),
                ]);

                const currentDate = new Date();
                const currentDateStr = currentDate.toISOString().split("T")[0];

                const tournamentStart = tournamentRes?.data?.startDate;
                const tournamentEnd = tournamentRes?.data?.endDate;
                const isDuringTournament = currentDateStr >= tournamentStart && currentDateStr <= tournamentEnd;
                setIsTournamentStarted(isDuringTournament);

                const userData = curUserRes?.data;
                setCurrentUser(userData?.display_name || "");

                if (canEdit && !isAdmin) {
                    setDisplayName(user?.display_name || "");
                    setInitialDisplayName(user?.display_name || "");
                } else {
                    setDisplayName(userData?.display_name || "");
                    setInitialDisplayName(userData?.display_name || "");
                }

                const errors = [
                    charsRes.success ? null : charsRes.error,
                    weaponsRes.success ? null : weaponsRes.error,
                ].filter(Boolean);

                if (errors.length > 0) {
                    setError(errors.join(", "));
                } else {
                    setError(null);
                }
            } catch (err) {
                setError("Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        nickname && canEdit !== undefined && loadData();
    }, [user, isAdmin, nickname, canEdit]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Проверка типа файла
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Only JPG and PNG files are allowed");
            return;
        }

        // Проверка размера файла (например, до 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("File size should be less than 5MB");
            return;
        }

        await screenshotsActions.handleUpload(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const nicknameChanged = displayName !== user?.username;

            if (nicknameChanged && canEdit) {
                const nicknameRes = await updateDisplayName(nickname, displayName);
                if (!nicknameRes.success) {
                    setError(nicknameRes.error);
                } else {
                    checkAuth();
                    setInitialDisplayName(displayName);
                }
            }

            const [charsRes, weaponsRes] = await Promise.all([
                charactersActions.saveChanges(),
                weaponsActions.saveChanges(),
            ]);

            const errors = [
                charsRes.success ? null : charsRes.error,
                weaponsRes.success ? null : weaponsRes.error,
            ].filter(Boolean);

            if (errors.length > 0) {
                setError(errors.join(", "));
            }
        } catch (err) {
            setError("Failed to save changes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisplayNameChange = (e) => {
        setDisplayName(e.target.value);
    };

    return (
        <div className={styles.playerContainer}>
            <Header />
            <div className={styles.playerContent}>
                <div className={styles.tableContainer}>
                    <h3 className={styles.tableTitle}>
                        <Trans>CHARACTERS</Trans>
                    </h3>
                    <div className={styles.playerTable}>
                        {canEdit && (
                            <div className={styles.addButtonContainer}>
                                <Item isAddButton onAddClick={charactersActions.toggleDropdown} />
                                {charactersState.dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <input
                                            type="text"
                                            placeholder="Search characters..."
                                            value={characterSearch}
                                            onChange={(e) => setCharacterSearch(e.target.value)}
                                            className={styles.searchInput}
                                        />
                                        <div className={styles.dropdownItems}>
                                            {charactersState.dropdownItems
                                                .filter((item) =>
                                                    item.name.toLowerCase().includes(characterSearch.toLowerCase())
                                                )
                                                .map((item, i) => (
                                                    <Item
                                                        showStats={false}
                                                        key={`${item.name}${i}`}
                                                        type="character"
                                                        name={item.name}
                                                        rarity={item.rarity}
                                                        showTrash={false}
                                                        onAddClick={() => charactersActions.handleAddItem(item)}
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {isLoading
                            ? Array(10)
                                  .fill(0)
                                  .map((_, i) => <SkeletonItem key={`skeleton-${i}`} />)
                            : charactersState.displayItems.map((ch, i) => (
                                  <Item
                                      key={`${ch.name}${i}`}
                                      showTrash={canEdit}
                                      canEdit={canEdit}
                                      type="character"
                                      name={ch.name}
                                      value1={ch.value1}
                                      value2={ch.value2}
                                      rarity={ch.rarity}
                                      onRemoveClick={() => charactersActions.handleRemoveItem(ch.name)}
                                      onValueChange={charactersActions.handleValueChange}
                                  />
                              ))}
                    </div>
                </div>
                <div className={styles.nicknameContainer}>
                    <div>
                        <div className={styles.tableContainer}>
                            <h3 className={styles.tableSubtitle}>
                                <Trans>nickname</Trans>
                            </h3>
                            <input
                                type="text"
                                value={displayName}
                                onChange={handleDisplayNameChange}
                                id="nickname"
                                placeholder="nickname"
                                disabled={!canEdit || (!isAdmin && isTournamentStarted)}
                                required
                                className={styles.nicknameInput}
                            />
                            {error && <div className={styles.errorBlock}>{error}</div>}
                        </div>
                        {isScreenShots && (
                            <div className={styles.screenshotsContainer}>
                                <h3 className={styles.tableSubtitle}>
                                    <Trans>screenshots</Trans>
                                </h3>
                                <div
                                    className={styles.playerTable}
                                    style={{ height: "200px", width: "300px", overflowY: "auto" }}
                                >
                                    {screenshotsState.loading ? (
                                        <div className={styles.emptyState}>
                                            <Trans>Loading</Trans>
                                        </div>
                                    ) : screenshotsState.screenshots.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <Trans>No screenshots yet</Trans>
                                        </div>
                                    ) : (
                                        screenshotsState.screenshots.map((screenshot, i) => (
                                            <div key={screenshot.id} className={styles.screenshotItem}>
                                                <img
                                                    src={screenshot.url}
                                                    alt={screenshot.description || "Screenshot"}
                                                    className={styles.screenshotImage}
                                                    onClick={() => openModal(i)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                                {canEdit && (
                                                    <button
                                                        onClick={() => deletePlayerScreenshotById(screenshot.id)}
                                                        className={styles.trashButton}
                                                    >
                                                        <FiTrash2 className={styles.trashIcon} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png"
                                    style={{ display: "none" }}
                                />
                                {canEdit && (
                                    <button
                                        onClick={triggerFileInput}
                                        disabled={screenshotsState.uploading}
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            marginTop: "10px",
                                        }}
                                        title="Add screenshot (jpg, png)"
                                    >
                                        {screenshotsState.uploading ? "Uploading..." : <FiUpload />}
                                    </button>
                                )}
                                {screenshotsState.uploadError && (
                                    <div className={styles.errorText}>{screenshotsState.uploadError}</div>
                                )}
                                {screenshotsState.loadError && (
                                    <div className={styles.errorText}>{screenshotsState.loadError}</div>
                                )}
                            </div>
                        )}
                    </div>
                    {canEdit && (
                        <Button
                            disabled={isSaveDisabled || isLoading}
                            onClick={handleSave}
                            style={{ width: "205px", fontSize: "25px" }}
                        >
                            <Trans>save</Trans>
                        </Button>
                    )}
                </div>
                <div className={styles.tableContainer}>
                    <h3 className={styles.tableTitle}>
                        <Trans>WEAPONS</Trans>
                    </h3>
                    <div className={styles.playerTable}>
                        {canEdit && (
                            <div className={styles.addButtonContainer}>
                                <Item isAddButton onAddClick={weaponsActions.toggleDropdown} />
                                {weaponsState.dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <input
                                            type="text"
                                            placeholder="Search weapons..."
                                            value={weaponSearch}
                                            onChange={(e) => setWeaponSearch(e.target.value)}
                                            className={styles.searchInput}
                                        />
                                        <div className={styles.dropdownItems}>
                                            {weaponsState.dropdownItems
                                                .filter((item) =>
                                                    item.name.toLowerCase().includes(weaponSearch.toLowerCase())
                                                )
                                                .map((item, i) => (
                                                    <Item
                                                        showStats={false}
                                                        key={`${item.name}${i}`}
                                                        type="weapon"
                                                        name={item.name}
                                                        rarity={item.rarity}
                                                        showTrash={false}
                                                        onAddClick={() => weaponsActions.handleAddItem(item)}
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {isLoading
                            ? Array(10)
                                  .fill(0)
                                  .map((_, i) => <SkeletonItem key={`skeleton-${i}`} />)
                            : weaponsState.displayItems.map((weapon, i) => (
                                  <Item
                                      key={`${weapon.name}${i}`}
                                      showTrash={canEdit}
                                      canEdit={canEdit}
                                      type="weapon"
                                      name={weapon.name}
                                      value1={weapon.value1}
                                      value2={weapon.value2}
                                      rarity={weapon.rarity}
                                      onRemoveClick={() => weaponsActions.handleRemoveItem(weapon.name)}
                                      onValueChange={weaponsActions.handleValueChange}
                                  />
                              ))}
                    </div>
                </div>
            </div>
            <footer>
                <TwitchStreamers />
            </footer>
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalNavLeft} onClick={prevScreenshot}>
                            ←
                        </button>
                        <img
                            src={screenshotsState.screenshots[currentScreenshotIndex].url}
                            alt="Full Screenshot"
                            className={styles.modalImage}
                        />
                        <button className={styles.modalNavRight} onClick={nextScreenshot}>
                            →
                        </button>
                        <button className={styles.modalClose} onClick={closeModal}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Player;

// 1. Вынести modal в компонент
// 2. Вынести dropdown в компонент
// 3. Вынести screenshot в компонент
