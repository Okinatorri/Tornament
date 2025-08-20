import React, { useEffect, useState } from "react";

import { characterImages, galogramsImages, weaponImages } from "../../constants/imageImports";

import { getRarityStyle } from "./utils";
import { FiTrash2 } from "react-icons/fi";

import classNames from "classnames";
import styles from "./styles.module.scss";

const Item = ({
    placeholder = "",
    type = "",
    name = "",
    value1,
    value2,
    rarity = 4,
    disabled = false,
    isAddButton = false,
    showTrash = true,
    showStats = true,
    canEdit = true,
    onAddClick = () => {},
    onRemoveClick = () => {},
    onValueChange = () => {},
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(null);

    const [localValue1, setLocalValue1] = useState(value1 ?? 1);
    const [localValue2, setLocalValue2] = useState(value2 ?? (type === "weapon" ? 1 : 0));

    useEffect(() => {
        setLocalValue1(value1 ?? 1);
        setLocalValue2(value2 ?? (type === "weapon" ? 1 : 0));
    }, [value1, value2, type]);

    const handleBlur = (field) => (e) => {
        let value = e.target.value;

        if (value === "" || value === "0") {
            if (field === "value1") {
                value = 1;
                setLocalValue1(value);
            } else if (field === "value2") {
                value = type === "weapon" ? 1 : 0;
                setLocalValue2(value);
            }
        }

        onValueChange(
            name,
            field === "value1" ? parseInt(value) || 1 : localValue1,
            field === "value2" ? parseInt(value) || (type === "weapon" ? 1 : 0) : localValue2
        );
    };

    const handleValue1Change = (e) => {
        const input = e.target.value;

        if (/^\d*$/.test(input)) {
            const max = 90;
            setLocalValue1(input === "" ? "" : Math.min(parseInt(input), max));
        }
    };

    const handleValue2Change = (e) => {
        const input = e.target.value;
        if (/^\d*$/.test(input)) {
            const max = type === "weapon" ? 5 : 6;
            setLocalValue2(input === "" ? "" : Math.min(parseInt(input), max));
        }
    };

    useEffect(() => {
        const loadImage = () => {
            try {
                let image;
                if (type === "weapon") image = weaponImages[name];
                if (type === "character") image = characterImages[name];
                if (type === "galogram") image = galogramsImages[name];
                setImageSrc(image);
            } catch (e) {}
        };
        type && name && loadImage();
    }, [type, name]);

    const prefix = type === "weapon" ? "R" : "C";

    const rarityStyle = getRarityStyle(rarity);

    return (
        <>
            {isAddButton ? (
                <div className={styles.addItemContainer}>
                    <button disabled={disabled} onClick={onAddClick} className={styles.addItem} style={rarityStyle}>
                        +
                    </button>
                </div>
            ) : (
                <div onClick={onAddClick} className={styles.itemContainer} {...props}>
                    {name || !placeholder ? (
                        <img
                            className={styles.itemImage}
                            style={{ filter: disabled ? "brightness(0.5)" : "none", ...rarityStyle }}
                            src={imageSrc}
                            alt=""
                        />
                    ) : (
                        <div
                            className={classNames(styles.addItemContainer, styles.itemImage)}
                            style={{ ...rarityStyle, paddingLeft: "2px", fontSize: "40px" }}
                        >
                            {placeholder}
                        </div>
                    )}
                    {showStats &&
                        (canEdit ? (
                            <div className={styles.valueContainer} style={rarityStyle}>
                                <input
                                    className={styles.valueText}
                                    value={localValue1 === "" ? "" : localValue1}
                                    onChange={handleValue1Change}
                                    onBlur={handleBlur("value1")}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />{" "}
                                |{" "}
                                <span className={styles.valueText}>
                                    {prefix}
                                    <input
                                        value={localValue2 === "" ? "" : localValue2}
                                        onChange={handleValue2Change}
                                        onBlur={handleBlur("value2")}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                    />
                                </span>
                            </div>
                        ) : (
                            <div className={styles.valueContainer} style={rarityStyle}>
                                <span className={styles.valueText}>{value1}</span> |{" "}
                                <span className={styles.valueText}>
                                    {prefix}
                                    {value2}
                                </span>
                            </div>
                        ))}
                    {showTrash && (
                        <button onClick={onRemoveClick} className={styles.trashButton}>
                            <span style={{ paddingBottom: "25%" }}>×</span>
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default Item;
