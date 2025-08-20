import React from "react";

import ContentLoader from "react-content-loader";

import styles from "./styles.module.scss";

const SkeletonItem = (props) => (
    <ContentLoader
        // className={styles.skeletonItem}
        speed={2}
        width={80}
        height={80}
        viewBox="0 0 200 200"
        backgroundColor="#2a2a2a"
        foregroundColor="#3a3a3a"
        {...props}
    >
        <circle cx="50%" cy="50%" r="100" />
    </ContentLoader>
);

export default SkeletonItem;
