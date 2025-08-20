import React, { lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import styles from "./styles.module.scss";

// const About = lazy(() => import("./about"));
// const Rules = lazy(() => import("./rules"));
// const Participate = lazy(() => import("./participate"));
// const Brackets = lazy(() => import("./bracket"));
// const NotFound = lazy(() => import("./not-found"));
// const NotAuth = lazy(() => import("./not-auth"));

import About from "./about";
import Rules from "./rules";
import Participate from "./participate";
import Brackets from "./bracket";
import NotAuth from "./not-auth";
import NotFound from "./not-found";
import Player from "./player";
import Admin from "./admin";
import Settings from "./settings";
import History from "./history";

const App = () => {
    return (
        <div className={styles.app}>
            <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                <Routes>
                    {/* user */}
                    <Route path="/" element={<Navigate to="/about" />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/participate" element={<Participate />} />
                    <Route path="/bracket" element={<Brackets />} />
                    <Route path="/participate" element={<Participate />} />
                    <Route path="/player/:nickname" element={<Player />} />

                    <Route path="/history" element={<History />} />

                    {/* admin */}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/settings" element={<Settings />} />

                    <Route path="/401" element={<NotAuth />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" />} />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
