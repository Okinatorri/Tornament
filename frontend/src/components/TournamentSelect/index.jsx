import React, { useState, useEffect, useRef } from "react";

import styles from "./styles.module.scss";

const TournamentSelect = ({
    label = "",
    labelPos = "V",
    options = [],
    value,
    onChange,
    placeholder = "",
    disabled,
    style = {},
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter((option) =>
        option.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (selectedOption) => {
        onChange(selectedOption);

        setSearchTerm(selectedOption.tournamentName);
        setIsDropdownOpen(false);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (value && options.length) {
            const selectedOption = options.find((opt) =>
                typeof value === "string" ? opt.tournamentName === value : opt.tournamentName === value?.tournamentName
            );
            if (selectedOption) {
                setSearchTerm(selectedOption.tournamentName);
            }
        }
    }, [value, options]);

    return (
        <div className={labelPos === "V" ? styles.lableVert : styles.labelHor}>
            {label && <label style={{ cursor: "default" }}>{label}:</label>}
            <div ref={dropdownRef} className={styles.dropdown} style={style}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={styles.searchInput}
                />
                {isDropdownOpen && filteredOptions.length > 0 && (
                    <ul className={styles.menu}>
                        {filteredOptions.map((option) => (
                            <li
                                key={option.tournamentName}
                                onClick={() => handleSelect(option)}
                                className={styles.menuItem}
                            >
                                {option.tournamentName}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TournamentSelect;
