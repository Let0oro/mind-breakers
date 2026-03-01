import { z } from 'zod'
import { idSchema, timestampSchema } from '../shared/schema'

/**
 * Organization Domain Schemas
 */

export const organizationSchema = z.object({
    id: idSchema,
    name: z.string().min(1).max(255),
    description: z.string().nullish(),
    website_url: z.string().url().nullish().or(z.string().length(0)),
    is_validated: z.boolean().default(false),
    created_at: timestampSchema,
    created_by: idSchema,
})

export const organizationListItemSchema = organizationSchema.pick({
    id: true,
    name: true,
    description: true,
    website_url: true,
    is_validated: true,
}).extend({
    expeditions: z.array(z.object({ id: idSchema })).nullish(),
    quests: z.array(z.object({ id: idSchema })).nullish(),
})

export type Organization = z.infer<typeof organizationSchema>
export type OrganizationListItem = z.infer<typeof organizationListItemSchema>
