import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    details?: unknown
}

/**
 * Helper to create consistent API responses
 */
export class ResponseHelper {
    /**
     * Return a success response
     */
    static success<T>(data: T, status = 200) {
        return NextResponse.json(
            {
                success: true,
                data,
            },
            { status }
        )
    }

    /**
     * Return an error response
     */
    static error(message: string, status = 400, details?: unknown) {
        return NextResponse.json(
            {
                success: false,
                error: message,
                details,
            },
            { status }
        )
    }

    /**
     * Utility to handle Zod validation errors
     */
    static handleValidationError(error: unknown) {
        if (error instanceof z.ZodError) {
            return this.error(
                'Validation failed',
                400,
                error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message
                }))
            )
        }
        return this.error('An unexpected error occurred', 500)
    }
}
