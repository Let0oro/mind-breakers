import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

test('Smoke test: Setup works', () => {
    render(<div data-testid="smoke">Hello World</div>)
    expect(screen.getByTestId('smoke')).toHaveTextContent('Hello World')
})
