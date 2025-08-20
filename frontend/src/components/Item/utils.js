export const getRarityStyle = (rarity) => {
    switch (rarity) {
        case 0:
            return {
                textShadow: "var(--red-shadow-1px)",
                boxShadow: "var(--red-shadow-2px)",
            };
        case 4:
            return {
                textShadow: "var(--purple-shadow-1px)",
                boxShadow: "var(--purple-shadow-2px)",
            };
        case 5:
            return {
                textShadow: "var(--gold-shadow-1px)",
                boxShadow: "var(--gold-shadow-2px)",
            };
        default:
            return {
                textShadow: "var(--purple-shadow-1px)",
                boxShadow: "var(--purple-shadow-2px)",
            };
    }
};
