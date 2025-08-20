import axios from "axios";

import { BACKEND_URL } from "../constants";

export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function checkSession() {
    try {
        const response = await api.get("/check_session");
        const data = response.data;

        if (data.is_logged_in) {
            return data.user;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export async function getPlayer(playerName) {
    try {
        const response = await api.get(`/players/${playerName}`);
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to load player ${playerName}`,
        };
    }
}

export async function getPlayers() {
    try {
        const response = await api.get("/players");
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to load players list",
        };
    }
}

export async function getCharacters() {
    try {
        const response = await api.get("/characters");
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to load characters",
        };
    }
}

export async function getPlayerCharacters(playerName) {
    try {
        const response = await api.get(`/player/${playerName}/characters`);
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to load ${playerName}'s characters`,
        };
    }
}

export async function addPlayerCharacters(playerName, characters) {
    try {
        const response = await api.post(`/player/${playerName}/characters`, {
            characters: characters,
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to add characters to ${playerName}`,
        };
    }
}

export async function deletePlayerCharacters(playerName, characters) {
    try {
        const response = await api.delete(`/player/${playerName}/characters`, {
            data: { characters: characters },
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to delete characters to ${playerName}`,
        };
    }
}

export async function updatePlayerCharacters(playerName, updates) {
    try {
        const response = await api.patch(`/player/${playerName}/characters`, updates);

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to update characters for ${playerName}`,
        };
    }
}

export async function getWeapons() {
    try {
        const response = await api.get("/weapons");
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to load weapons",
        };
    }
}

export async function getPlayerWeapons(playerName) {
    try {
        const response = await api.get(`/player/${playerName}/weapons`);
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to load ${playerName}'s weapons`,
        };
    }
}

export async function addPlayerWeapons(playerName, weapons) {
    try {
        const response = await api.post(`/player/${playerName}/weapons`, {
            weapons: weapons,
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to add weapons to ${playerName}`,
        };
    }
}

export async function deletePlayerWeapons(playerName, weapons) {
    try {
        const response = await api.delete(`/player/${playerName}/weapons`, {
            data: { weapons: weapons },
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to delete weapons to ${playerName}`,
        };
    }
}

export async function updatePlayerWeapons(playerName, updates) {
    try {
        const response = await api.patch(`/player/${playerName}/weapons`, updates);

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to update weapons for ${playerName}`,
        };
    }
}

export async function getPlayerScreenshots(playerName) {
    try {
        const response = await api.get(`/player/${playerName}/screenshots`);
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to load ${playerName}'s screenshots`,
        };
    }
}

export async function deletePlayerScreenshotById(screenshotId) {
    try {
        const response = await api.delete(`/screenshots/${screenshotId}`);

        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to delete player screenshot",
        };
    }
}

export async function uploadPlayerScreenshot(playerName, file) {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post(`/player/${playerName}/screenshots`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to upload screenshot for ${playerName}`,
        };
    }
}

export async function updateDisplayName(playerName, displayName) {
    try {
        const name = displayName?.trim() || "";
        const response = await api.post(`/player/${playerName}/name`, {
            newDisplayName: name,
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || `Failed to change player display name`,
        };
    }
}

export async function getAllTournaments() {
    try {
        const response = await api.get("/tournaments");
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to load tournaments",
        };
    }
}

export async function getActiveTournament() {
    try {
        const response = await api.get("/tournaments/active");
        return {
            success: true,
            data: response.data.data,
        };
    } catch (error) {
        if (error.response?.status === 409) {
            return {
                success: false,
                error: "Multiple active tournaments detected. Please contact administrator.",
                details: error.response.data,
            };
        }

        return {
            success: false,
            error: error.response?.data?.message || "Failed to load active tournament",
        };
    }
}

export async function getBannedCharacters(user1Id, user2Id) {
    try {
        const response = await api.post("/characters/banned", {
            user1_id: user1Id,
            user2_id: user2Id,
        });
        return {
            success: true,
            bannedCharacters: response.data.banned_characters,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to get banned characters",
        };
    }
}

export async function getTournamentGamesByName(tournamentName) {
    try {
        const response = await api.get(`/tournaments/${tournamentName}/games`);
        return {
            success: true,
            games: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to get tournament games",
        };
    }
}

export async function getActiveTournamentGames() {
    try {
        const response = await api.get("/tournaments/games/active");
        return {
            success: true,
            games: response.data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to get active tournament games",
        };
    }
}

export async function addTournamentGame(gameData) {
    try {
        const response = await api.post("/tournaments/games", gameData);
        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to add tournament game",
        };
    }
}

export async function updateTournamentGame(gameId, updatedGameData) {
    try {
        const response = await api.patch(`/tournaments/games/${gameId}`, updatedGameData);
        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to update tournament game",
        };
    }
}

export async function deleteTournamentGame(gameId) {
    try {
        const response = await api.delete(`/tournaments/games/${gameId}`);
        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || "Failed to delete tournament game",
        };
    }
}

export async function createTournament(tournamentData) {
    try {
        const response = await api.post("/tournaments", tournamentData);

        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        let errorMessage = "Failed to create tournament";
        if (error.response) {
            if (error.response.status === 400) {
                errorMessage = error.response.data.message || "Validation error";
            } else if (error.response.status === 409) {
                errorMessage = "Tournament with this name already exists";
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

export async function deleteTournament(tournamentName) {
    try {
        const response = await api.delete(`/tournaments/${tournamentName}`);
        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to delete tournament",
        };
    }
}

export async function updateTournament(tournamentName, updateData) {
    try {
        const response = await api.patch(`/tournaments/${tournamentName}`, updateData);
        return {
            success: true,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to update tournament",
        };
    }
}

export async function deactivateAllTournaments() {
    try {
        const response = await api.patch("/tournaments/deactivate-all");
        return {
            success: true,
            message: response.data.message,
            count: response.data.modified_count || 0,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || "Failed to deactivate tournaments",
        };
    }
}
