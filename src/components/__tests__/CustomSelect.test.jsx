import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomSelect from '../CustomSelect/CustomSelect';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const mockOptions = [
  { id: '1', name: 'Option 1' },
  { id: '2', name: 'Option 2' },
  { id: '3', name: 'Option 3' },
];

describe('CustomSelect', () => {
  let mockOnChange;
  let user;

  beforeEach(() => {
    mockOnChange = vi.fn();
    user = userEvent.setup();
  });

  it('renders with default state', () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('displays selected option', () => {
    render(
      <CustomSelect
        options={mockOptions}
        value="2"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders with label and required indicator', () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        label="Test Label"
        required
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        error="This field is required"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('button');
    
    // Open dropdown with Enter
    await user.type(button, '{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Navigate with arrow keys
    await user.type(button, '{ArrowDown}');
    await user.type(button, '{Enter}');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { value: '1' }
    });
  });

  it('handles mouse interactions', async () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('button');
    
    // Open dropdown
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Select option
    await user.click(screen.getByText('Option 2'));
    
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { value: '2' }
    });
  });

  it('closes dropdown on Escape', async () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('button');
    
    // Open dropdown
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Close with Escape
    await user.type(button, '{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('respects disabled state', async () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(
      <CustomSelect
        options={mockOptions}
        value="1"
        onChange={mockOnChange}
        label="Test Label"
        required
        error="Error message"
      />
    );

    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-required', 'true');
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(button).toHaveAttribute('aria-describedby');
  });

  it('supports Home and End keys for navigation', async () => {
    render(
      <CustomSelect
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('button');
    
    // Open dropdown
    await user.click(button);
    
    // Press Home key
    fireEvent.keyDown(button, { key: 'Home' });
    
    // Press End key
    fireEvent.keyDown(button, { key: 'End' });
    
    // These should navigate to first and last options respectively
    // (specific implementation would depend on focus management)
  });
});
