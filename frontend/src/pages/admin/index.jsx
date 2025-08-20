import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "./../../state-providers/AdminContext/index";
import { useUser } from "../../state-providers/UserContext";

import { GalogramsStep } from "./GalogramsStep";
import { PickBansStep } from "./PickBansStep";
import { TimersStep } from "./TimersStep";

import styles from "./styles.module.scss";

const AdminContent = () => {
    const { step } = useAdmin();
    const navigate = useNavigate();
    const { user, isLoading } = useUser();

    useEffect(() => {
        if (!user || user?.status !== "admin") {
            !isLoading && navigate("/401");
        }
    }, [user, isLoading, navigate]);

    return (
        <div className={styles.adminContainer}>
            {step === 1 && <GalogramsStep />}
            {step === 2 && <PickBansStep />}
            {step === 3 && <TimersStep />}
        </div>
    );
};

export const Admin = () => {
    return (
        <AdminProvider>
            <AdminContent />
        </AdminProvider>
    );
};

export default Admin;
