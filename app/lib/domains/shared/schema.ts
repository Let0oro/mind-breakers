import { z } from 'zod'

/**
 * Shared Zod schemas for the domain data layer
 */

export const idSchema = z.string().uuid()
export const timestampSchema = z.string().datetime().or(z.date())

export const paginationSchema = z.object({
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
})

export type ID = z.infer<typeof idSchema>
export type Timestamp = z.infer<typeof timestampSchema>
export type Pagination = z.infer<typeof paginationSchema>
