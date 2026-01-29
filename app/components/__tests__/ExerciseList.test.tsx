import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExerciseList } from '../ExerciseList'

describe('ExerciseList', () => {
    test('renders empty state', () => {
        render(<ExerciseList exercises={[]} />)
        expect(screen.getByText('No exercises found')).toBeInTheDocument()
    })

    test('renders exercises with correct status', () => {
        const exercises = [
            { id: '1', title: 'Ex 1', status: 'completed' as const, xp_reward: 10 },
            { id: '2', title: 'Ex 2', status: 'in_progress' as const },
        ]

        render(<ExerciseList exercises={exercises} />)

        expect(screen.getByText('Ex 1')).toBeInTheDocument()
        expect(screen.getByText('Ex 2')).toBeInTheDocument()

        // Check status badges
        expect(screen.getByText('completed')).toBeInTheDocument()
        expect(screen.getByText('in progress')).toBeInTheDocument() // 'in_progress'.replace('_', ' ')
    })

    test('links to correct submission page', () => {
        const exercises = [
            { id: '1', title: 'Ex 1', status: 'not_started' as const },
        ]
        render(<ExerciseList exercises={exercises} />)

        const link = screen.getByRole('link', { name: /start exercise/i })
        expect(link).toHaveAttribute('href', '/dashboard/exercises/1/submit')
    })
})
