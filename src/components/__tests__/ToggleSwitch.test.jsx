import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    label: ({ children, ...props }) => <label {...props}>{children}</label>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

describe('ToggleSwitch', () => {
  let mockOnChange;
  let user;

  beforeEach(() => {
    mockOnChange = vi.fn();
    user = userEvent.setup();
  });

  it('renders with default state', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('renders checked state', () => {
    render(
      <ToggleSwitch
        checked={true}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('displays label when provided', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
        label="Enable feature"
      />
    );

    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', async () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
        disabled
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', async () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    
    // Focus the checkbox
    await user.tab();
    expect(checkbox).toHaveFocus();

    // Toggle with space
    await user.keyboard(' ');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA attributes', () => {
    render(
      <ToggleSwitch
        checked={true}
        onChange={mockOnChange}
        aria-label="Toggle dark mode"
        name="darkMode"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    
    expect(checkbox).toHaveAttribute('aria-label', 'Toggle dark mode');
    expect(checkbox).toHaveAttribute('name', 'darkMode');
  });

  it('supports aria-labelledby', () => {
    render(
      <div>
        <span id="toggle-label">Dark Mode</span>
        <ToggleSwitch
          checked={false}
          onChange={mockOnChange}
          aria-labelledby="toggle-label"
        />
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-labelledby', 'toggle-label');
  });

  it('supports aria-describedby', () => {
    render(
      <div>
        <ToggleSwitch
          checked={false}
          onChange={mockOnChange}
          aria-describedby="toggle-description"
        />
        <span id="toggle-description">This toggles dark mode</span>
      </div>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby', 'toggle-description');
  });

  it('handles label click to toggle', async () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
        label="Enable notifications"
      />
    );

    const label = screen.getByText('Enable notifications');
    await user.click(label);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('applies disabled styles when disabled', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
        disabled
        label="Disabled toggle"
      />
    );

    const container = screen.getByText('Disabled toggle').closest('div');
    expect(container).toHaveClass('disabled');
  });

  it('generates unique ID for accessibility', () => {
    const { rerender } = render(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
      />
    );

    const firstCheckbox = screen.getByRole('checkbox');
    const firstId = firstCheckbox.id;

    rerender(
      <ToggleSwitch
        checked={false}
        onChange={mockOnChange}
      />
    );

    const secondCheckbox = screen.getByRole('checkbox');
    const secondId = secondCheckbox.id;

    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });
});
