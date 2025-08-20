import { useState } from "react";

import { getPlayerScreenshots, uploadPlayerScreenshot } from "../../api";

export const useScreenshotsState = (username) => {
    const [screenshots, setScreenshots] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const loadScreenshots = async () => {
        if (!username) return;

        setLoading(true);
        setLoadError(null);

        try {
            const response = await getPlayerScreenshots(username);
            if (response.success) {
                // Преобразуем бинарные данные в URL для каждого скриншота
                const screenshotsWithUrls = response.data.map((screenshot) => {
                    if (screenshot.image_data) {
                        // Создаем URL из бинарных данных
                        const url = `data:${screenshot.content_type};base64,${screenshot.image_data}`;
                        return { ...screenshot, url };
                    }
                    return screenshot;
                });
                setScreenshots(screenshotsWithUrls);
            } else {
                setLoadError(response.error);
            }
            return response;
        } catch (err) {
            setLoadError("Failed to load screenshots");
            return { success: false, error: "Failed to load screenshots" };
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file) => {
        if (!file || !username) return;

        setUploading(true);
        setUploadError(null);

        try {
            const response = await uploadPlayerScreenshot(username, file);

            if (response.success) {
                setScreenshots((prev) => [...prev, response.data]);
            } else {
                setUploadError(response.error);
            }
            return response;
        } catch (err) {
            setUploadError("Failed to upload screenshot");
            return { success: false, error: "Failed to upload screenshot" };
        } finally {
            setUploading(false);
        }
    };

    return {
        state: {
            screenshots,
            uploading,
            uploadError,
            loading,
            loadError,
        },
        actions: {
            loadScreenshots,
            handleUpload,
        },
    };
};
