import { z } from 'zod'
import { idSchema, timestampSchema } from '../shared/schema'

/**
 * User/Profile Domain Schemas
 */

export const profileSchema = z.object({
    id: idSchema,
    username: z.string().min(3).max(50).nullish(),
    full_name: z.string().nullish(),
    avatar_url: z.string().url().nullish().or(z.string().length(0)),
    website: z.string().url().nullish(),
    is_admin: z.boolean().default(false),
    updated_at: timestampSchema.nullish(),
})

export type Profile = z.infer<typeof profileSchema>
