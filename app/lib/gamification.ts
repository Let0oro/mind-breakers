
export const BASE_XP = 300;
export const XP_MULTIPLIER = 1.5;

/**
 * Calculates the XP required to complete the specified level and advance to the next.
 * Formula: Base XP * (Multiplier ^ (Level - 1))
 */
export function getXpRequiredForLevel(level: number): number {
    return Math.round(BASE_XP * Math.pow(XP_MULTIPLIER, level - 1));
}

/**
 * Calculates the total accumulated XP required to reach a specific level.
 * @param targetLevel The level to reach (e.g., to reach Level 2, you need to complete Level 1)
 */
export function getTotalXpForLevel(targetLevel: number): number {
    let totalXp = 0;
    for (let i = 1; i < targetLevel; i++) {
        totalXp += getXpRequiredForLevel(i);
    }
    return totalXp;
}

/**
 * Calculates the current level based on total accumulated XP.
 * @param totalXp The total XP user has earned
 */
export function getLevelFromXp(totalXp: number): number {
    let level = 1;
    while (true) {
        const xpForNext = getXpRequiredForLevel(level);
        const requiredTotal = getTotalXpForLevel(level + 1); // Total needed to reach next level

        // Equivalent check: if current total XP is less than what's needed for next level, we are at this level.
        // Or: iterate, subtracting XP required for each level until we can't anymore.

        if (totalXp < requiredTotal) {
            return level;
        }
        level++;
    }
}

/**
 * Returns progress statistics for the current level.
 */
export function getLevelProgress(totalXp: number, level: number): { current: number; required: number; percentage: number } {
    // Calculate total XP needed to reach the *start* of the current level
    const xpForPreviousLevels = getTotalXpForLevel(level);

    // XP actually earned *within* this level
    const xpInCurrentLevel = totalXp - xpForPreviousLevels;

    // XP required to finish this level
    const xpNeededForNextLevel = getXpRequiredForLevel(level);

    return {
        current: Math.max(0, xpInCurrentLevel),
        required: xpNeededForNextLevel,
        percentage: Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100))
    };
}
