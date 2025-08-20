import { useState } from "react";

import {
    getCharacters,
    getPlayerCharacters,
    addPlayerCharacters,
    deletePlayerCharacters,
    updatePlayerCharacters,
} from "../../api";

export const useCharactersState = (username) => {
    const [characters, setCharacters] = useState([]);
    const [playerCharacters, setPlayerCharacters] = useState([]);
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const [itemsToRemove, setItemsToRemove] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownItems, setDropdownItems] = useState([]);

    const [modifiedValues, setModifiedValues] = useState({});

    const handleValueChange = (name, value1, value2) => {
        setModifiedValues((prev) => ({
            ...prev,
            [name]: { value1, value2 },
        }));
    };

    const loadCharacters = async () => {
        try {
            const [allCharsRes, playerCharsRes] = await Promise.all([getCharacters(), getPlayerCharacters(username)]);

            if (allCharsRes.success) setCharacters(allCharsRes.data);
            if (playerCharsRes.success) setPlayerCharacters(playerCharsRes.data);

            return {
                success: allCharsRes.success && playerCharsRes.success,
                error: allCharsRes.error || playerCharsRes.error,
            };
        } catch (err) {
            return { success: false, error: "Failed to load characters" };
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
        if (!dropdownOpen) {
            const availableItems = characters.filter(
                (char) =>
                    (!playerCharacters.some((pc) => pc.name === char.name) || itemsToRemove.includes(char.name)) &&
                    !itemsToAdd.includes(char.name)
            );
            setDropdownItems(availableItems);
        }
    };

    const handleAddItem = (item) => {
        if (itemsToRemove.includes(item.name)) {
            setItemsToRemove(itemsToRemove.filter((name) => name !== item.name));
        } else {
            setItemsToAdd([...itemsToAdd, item.name]);
        }
        setDropdownOpen(false);
    };

    const handleRemoveItem = (name) => {
        if (itemsToAdd.includes(name)) {
            setItemsToAdd(itemsToAdd.filter((n) => n !== name));
        } else {
            setItemsToRemove([...itemsToRemove, name]);
        }
    };

    const getDisplayItems = () => {
        const addedItems = itemsToAdd.map((name) => characters.find((item) => item.name === name)).filter(Boolean);

        const baseItems = [...playerCharacters.filter((item) => !itemsToRemove.includes(item.name)), ...addedItems];

        // Применяем изменения из modifiedValues
        return baseItems.map((item) => {
            if (modifiedValues[item.name]) {
                return { ...item, ...modifiedValues[item.name] };
            }
            return item;
        });
    };

    const saveChanges = async () => {
        try {
            const results = await Promise.all([
                itemsToAdd.length > 0 ? addPlayerCharacters(username, itemsToAdd) : { success: true },
                itemsToRemove.length > 0 ? deletePlayerCharacters(username, itemsToRemove) : { success: true },
            ]);

            const errors = results.map((res) => (res.success ? null : res.error)).filter(Boolean);

            if (errors.length > 0) {
                return { success: false, error: errors.join(", ") };
            }

            if (Object.keys(modifiedValues).length > 0) {
                const updateRes = await updatePlayerCharacters(username, modifiedValues);
                if (!updateRes.success) {
                    return { success: false, error: updateRes.error };
                }
            }

            const updatedRes = await getPlayerCharacters(username);
            if (updatedRes.success) {
                setPlayerCharacters(updatedRes.data);
                setItemsToAdd([]);
                setItemsToRemove([]);
                setModifiedValues({});
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: "Failed to save characters" };
        }
    };

    return {
        state: {
            characters,
            playerCharacters,
            dropdownOpen,
            dropdownItems,
            displayItems: getDisplayItems(),
            hasChanges: itemsToAdd.length || itemsToRemove.length || Object.keys(modifiedValues).length,
        },

        actions: {
            loadCharacters,
            toggleDropdown,
            handleAddItem,
            handleRemoveItem,
            handleValueChange,
            saveChanges,
        },
    };
};
