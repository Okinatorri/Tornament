import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../state-providers/UserContext";
import { api } from "../../api";

import Header from "../../components/Header";
import Button from "../../components/Button";
import TwitchStreamers from "../../components/TwitchStreamers";
import Input from "../../components/Input";

import { Trans } from "@lingui/react/macro";

import styles from "./styles.module.scss";
import { GOOGLE_REGISTRATION_FORM } from "../../constants";

const Participate = () => {
    const [isLoginError, setIsLoginError] = useState(false);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);
    const navigate = useNavigate();

    const { user, checkAuth } = useUser();

    const methods = useForm();

    useEffect(() => {
        if (user?.username) {
            navigate(`/player/${user.username}`);
        }
    }, [user, navigate]);

    useEffect(() => {
        let timer;
        if (isRateLimited && remainingTime > 0) {
            timer = setTimeout(() => {
                setRemainingTime((prev) => prev - 1);
            }, 1000);
        } else if (remainingTime === 0 && isRateLimited) {
            setIsRateLimited(false);
            setAttemptCount(0);
        }
        return () => clearTimeout(timer);
    }, [isRateLimited, remainingTime]);

    const onSubmit = async (data) => {
        if (isRateLimited) return;

        try {
            const response = await api.post("/login", {
                username: data.login,
                password: data.password,
            });

            const name = response?.data?.user?.username || "";
            navigate(`/player/${name}`);
            setIsLoginError(false);
            setAttemptCount(0);
            checkAuth();
        } catch (error) {
            if (error?.response?.status === 401) {
                const newAttemptCount = attemptCount + 1;
                setAttemptCount(newAttemptCount);

                if (newAttemptCount >= 3) {
                    setIsRateLimited(true);
                    setRemainingTime(60); // 1 minute
                }
                setIsLoginError(true);
            } else if (error?.response?.status === 429) {
                setIsRateLimited(true);
                const time = error?.response?.data?.message?.match(/\d+/)?.[0] || 60;
                setRemainingTime(parseInt(time));
                setIsLoginError(true);
            }
        }
    };

    const handleButtonClick = () => {
        window.open(GOOGLE_REGISTRATION_FORM, "_blank");
    };

    return (
        <div className={styles.rulesContainer}>
            <Header />
            <div className={styles.participateContent}>
                <div className={styles.participateTitleContent}>
                    <div className={styles.participateTitle}>
                        <Trans>Join Us!</Trans>
                    </div>
                    <div>
                        <Button onClick={handleButtonClick}>
                            <p style={{ fontSize: "27px" }}>
                                <Trans>participate</Trans>
                            </p>
                        </Button>
                    </div>
                </div>
                <div>
                    <FormProvider {...methods}>
                        {isLoginError && !isRateLimited && (
                            <div className={styles.errorLoginBlock}>
                                <Trans>Invalid nickname or password</Trans>
                            </div>
                        )}
                        {isRateLimited && (
                            <div className={styles.errorLoginBlock}>
                                <Trans>Too many attempts. Try again in {remainingTime} seconds</Trans>
                            </div>
                        )}
                        <form className={styles.participateLoginForm} onSubmit={methods.handleSubmit(onSubmit)}>
                            <Input id="login" placeholder="username" disabled={isRateLimited} />
                            <Input id="password" type="password" placeholder="password" disabled={isRateLimited} />
                            <Button type="submit" disabled={isRateLimited}>
                                <p style={{ fontSize: "21px" }}>
                                    <Trans>log in</Trans>
                                </p>
                            </Button>
                        </form>
                    </FormProvider>
                </div>
            </div>
            <div>
                <TwitchStreamers />
            </div>
        </div>
    );
};

export default Participate;
