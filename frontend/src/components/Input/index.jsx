import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.scss";

const Input = ({ id, label = "", type = "text", defaultValue, value, requiredMessage, disabled, placeholder = "" }) => {
    const {
        register: formRegister,
        setValue,
        formState: { errors },
    } = useFormContext();

    useEffect(() => {
        if (value !== undefined) {
            setValue(id, value);
        }
    }, [id, value, setValue]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {label && <label style={{ cursor: "default" }}>{label}:</label>}
            <input
                placeholder={placeholder}
                disabled={disabled}
                className={styles.input}
                style={disabled ? { color: "gray" } : {}}
                type={type}
                id={id}
                {...formRegister(id, {
                    required: requiredMessage,
                    value: value,
                })}
                defaultValue={defaultValue}
                required
            />
            {errors[id] && <p style={{ color: "red" }}>{errors[id]?.message}</p>}
        </div>
    );
};

export default Input;
