import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should support different variants', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-red-600')
  })

  it('should support different sizes', () => {
    const { container } = render(<Button size="lg">Large</Button>)
    expect(container.querySelector('button')).toHaveClass('px-6')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('should show loading state', () => {
    const { container } = render(<Button loading>Loading</Button>)
    const button = container.querySelector('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })
})
