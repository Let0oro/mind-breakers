import { z } from 'zod'
import { idSchema, timestampSchema } from '../shared/schema'
import { questListItemSchema } from '../quests/schema'

/**
 * Expedition Domain Schemas
 */

export const expeditionSchema = z.object({
    id: idSchema,
    title: z.string().min(1).max(255),
    summary: z.string().max(500).nullish(),
    description: z.string().nullish(),
    thumbnail_url: z.string().url().nullish().or(z.string().length(0)),
    created_by: idSchema,
    created_at: timestampSchema,
    is_validated: z.boolean().default(false),
    organization_id: idSchema.nullish(),
})

export const expeditionListItemSchema = expeditionSchema.pick({
    id: true,
    title: true,
    summary: true,
    thumbnail_url: true,
    created_at: true,
    is_validated: true,
}).extend({
    organizations: z.object({
        id: idSchema,
        name: z.string()
    }).nullish(),
    quests: z.array(z.object({ id: idSchema })).nullish(),
    // For joined queries
    saved_expeditions: z.array(z.object({ user_id: idSchema })).nullish(),
})

export type Expedition = z.infer<typeof expeditionSchema>
export type ExpeditionListItem = z.infer<typeof expeditionListItemSchema>

/**
 * Form Validation Schemas
 */
export const expeditionFormSchema = expeditionSchema.pick({
    title: true,
    summary: true,
    description: true,
    thumbnail_url: true,
    organization_id: true,
})
