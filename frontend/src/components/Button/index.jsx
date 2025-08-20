import React from "react";

import classNames from "classnames";
import styles from "./styles.module.scss";

const Button = ({ children, onClick, type = "button", disabled = false, className = "", ...props }) => {
    const buttonClass = classNames(styles.button, className);

    return (
        <button type={type} onClick={onClick} className={buttonClass} disabled={disabled} {...props}>
            {children}
        </button>
    );
};

export default Button;
