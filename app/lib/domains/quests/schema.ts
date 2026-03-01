import { z } from 'zod'
import { idSchema, timestampSchema } from '../shared/schema'

/**
 * Quest Domain Schemas
 */

export const questStatusSchema = z.enum(['draft', 'pending', 'published', 'archived'])

export const questSchema = z.object({
    id: idSchema,
    title: z.string().min(1).max(255),
    summary: z.string().max(500).nullish(),
    description: z.string().nullish(),
    thumbnail_url: z.string().url().nullish().or(z.string().length(0)),
    xp_reward: z.number().int().nonnegative().default(0),
    is_validated: z.boolean().default(false),
    created_by: idSchema,
    created_at: timestampSchema,
    status: questStatusSchema.default('draft'),
    expedition_id: idSchema.nullish(),
    organization_id: idSchema.nullish(),
    order_index: z.number().int().nonnegative().default(0),
})

export const questListItemSchema = questSchema.pick({
    id: true,
    title: true,
    summary: true,
    thumbnail_url: true,
    xp_reward: true,
    is_validated: true,
    status: true,
    created_by: true,
}).extend({
    organizations: z.array(z.object({ name: z.string() })).nullish(),
    user_quest_progress: z.array(z.object({
        completed: z.boolean(),
        xp_earned: z.number()
    })).nullish(),
})

export type Quest = z.infer<typeof questSchema>
export type QuestStatus = z.infer<typeof questStatusSchema>
export type QuestListItem = z.infer<typeof questListItemSchema>

/**
 * Form Validation Schemas
 */
export const questFormSchema = questSchema.pick({
    title: true,
    summary: true,
    description: true,
    thumbnail_url: true,
    xp_reward: true,
    organization_id: true,
}).extend({
    // Add form-specific validations if needed
})
