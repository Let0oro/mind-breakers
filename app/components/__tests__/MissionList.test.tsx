import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MissionList } from '../features/MissionList'

describe('MissionList', () => {
    test('renders empty state', () => {
        render(<MissionList missions={[]} />)
        expect(screen.getByText('No missions found')).toBeInTheDocument()
    })

    test('renders missions with correct status', () => {
        const missions = [
            { id: '1', title: 'Ex 1', status: 'completed' as const, xp_reward: 10 },
            { id: '2', title: 'Ex 2', status: 'in_progress' as const },
        ]

        render(<MissionList missions={missions} />)

        expect(screen.getByText('Ex 1')).toBeInTheDocument()
        expect(screen.getByText('Ex 2')).toBeInTheDocument()

        // Check status badges
        expect(screen.getByText('completed')).toBeInTheDocument()
        expect(screen.getByText('in progress')).toBeInTheDocument() // 'in_progress'.replace('_', ' ')
    })

    test('links to correct submission page', () => {
        const missions = [
            { id: '1', title: 'Ex 1', status: 'not_started' as const },
        ]
        render(<MissionList missions={missions} />)

        const link = screen.getByRole('link', { name: /Start Mission/i })
        expect(link).toHaveAttribute('href', '/guild-hall/missions/1/submit')
    })
})
