'use server'

/**
 * Server actions for cache invalidation
 * Call these after mutations to refresh cached data
 * 
 * Note: Next.js 16 requires a second argument for revalidateTag
 * Using 'max' for background revalidation (SWR behavior)
 */

import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from './cache'

// Default revalidation profile for SWR behavior
const REVALIDATE_PROFILE = 'max'

// ============================================================================
// Tag-based Invalidation
// ============================================================================

/**
 * Invalidate all quest caches
 */
export async function invalidateQuestsCache() {
    revalidateTag(CACHE_TAGS.QUESTS, REVALIDATE_PROFILE)
}

/**
 * Invalidate a specific quest cache
 */
export async function invalidateQuestCache(questId: string) {
    revalidateTag(`quest-${questId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.QUESTS, REVALIDATE_PROFILE)
}

/**
 * Invalidate all expedition caches
 */
export async function invalidateExpeditionsCache() {
    revalidateTag(CACHE_TAGS.EXPEDITIONS, REVALIDATE_PROFILE)
}

/**
 * Invalidate a specific expedition cache
 */
export async function invalidateExpeditionCache(expeditionId: string) {
    revalidateTag(`expedition-${expeditionId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.EXPEDITIONS, REVALIDATE_PROFILE)
}

/**
 * Invalidate all organization caches
 */
export async function invalidateOrganizationsCache() {
    revalidateTag(CACHE_TAGS.ORGANIZATIONS, REVALIDATE_PROFILE)
}

/**
 * Invalidate user-specific caches
 */
export async function invalidateUserCache(userId: string) {
    revalidateTag(`user-${userId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.USER_PROGRESS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.USER_SAVED, REVALIDATE_PROFILE)
}

/**
 * Invalidate exercise-related caches
 */
export async function invalidateExercisesCache() {
    revalidateTag(CACHE_TAGS.EXERCISES, REVALIDATE_PROFILE)
}

/**
 * Invalidate submission-related caches
 */
export async function invalidateSubmissionsCache() {
    revalidateTag(CACHE_TAGS.SUBMISSIONS, REVALIDATE_PROFILE)
}

/**
 * Invalidate admin-related caches
 */
export async function invalidateAdminCache() {
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
}

// ============================================================================
// Expedition-based Invalidation (for specific routes)
// ============================================================================

/**
 * Invalidate dashboard page
 */
export async function invalidateDashboard() {
    revalidatePath('/guild-hall')
}

/**
 * Invalidate library page
 */
export async function invalidateLibrary() {
    revalidatePath('/guild-hall/library')
}

/**
 * Invalidate explore page
 */
export async function invalidateExplore() {
    revalidatePath('/guild-hall/world-map')
}

/**
 * Invalidate admin pages
 */
export async function invalidateAdminPages() {
    revalidatePath('/guild-hall/admin')
    revalidatePath('/guild-hall/admin/validations')
    revalidatePath('/guild-hall/admin/submissions')
    revalidatePath('/guild-hall/admin/requests')
}

// ============================================================================
// Combined Invalidation Helpers
// ============================================================================

/**
 * Call after creating/updating a quest
 */
export async function afterQuestChange(questId?: string) {
    if (questId) {
        revalidateTag(`quest-${questId}`, REVALIDATE_PROFILE)
    }
    revalidateTag(CACHE_TAGS.QUESTS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall')
    revalidatePath('/guild-hall/library')
    revalidatePath('/guild-hall/quests')
}

/**
 * Call after creating/updating a expedition
 */
export async function afterExpeditionChange(expeditionId?: string) {
    if (expeditionId) {
        revalidateTag(`expedition-${expeditionId}`, REVALIDATE_PROFILE)
    }
    revalidateTag(CACHE_TAGS.EXPEDITIONS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall')
    revalidatePath('/guild-hall/library')
    revalidatePath('/guild-hall/expeditions')
}

/**
 * Call after creating/updating an organization
 */
export async function afterOrganizationChange() {
    revalidateTag(CACHE_TAGS.ORGANIZATIONS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall/organizations')
}

/**
 * Call after saving/unsaving a quest
 */
export async function afterSaveQuestChange(userId: string) {
    revalidateTag(`user-${userId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.USER_SAVED, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall/library')
}

/**
 * Call after saving/unsaving a expedition
 */
export async function afterSaveExpeditionChange(userId: string) {
    revalidateTag(`user-${userId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.USER_SAVED, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall/library')
}

/**
 * Call after completing a quest or updating progress
 */
export async function afterProgressChange(userId: string) {
    revalidateTag(`user-${userId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.USER_PROGRESS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.EXPEDITIONS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.QUESTS, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall')
    revalidatePath('/guild-hall/library')
}

/**
 * Call after submitting an exercise
 */
export async function afterExerciseSubmission(userId: string) {
    revalidateTag(`user-${userId}`, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.EXERCISES, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.SUBMISSIONS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall/missions')
    revalidatePath('/guild-hall/admin/submissions')
}

/**
 * Call after approving/rejecting content in admin
 */
export async function afterAdminValidation() {
    revalidateTag(CACHE_TAGS.ADMIN, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.QUESTS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.EXPEDITIONS, REVALIDATE_PROFILE)
    revalidateTag(CACHE_TAGS.ORGANIZATIONS, REVALIDATE_PROFILE)
    revalidatePath('/guild-hall/admin')
    revalidatePath('/guild-hall/admin/validations')
}
