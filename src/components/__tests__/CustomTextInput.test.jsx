import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomTextInput from '../CustomTextInput/CustomTextInput';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    label: ({ children, ...props }) => <label {...props}>{children}</label>,
  },
}));

// Mock validation utilities
vi.mock('../../utils/validation', () => ({
  validateInput: vi.fn((value, options) => ({
    isValid: value.length >= (options.minLength || 0),
    error: value.length < (options.minLength || 0) ? 'Too short' : ''
  })),
  sanitizeInput: vi.fn((value) => value.replace(/<script>/g, ''))
}));

describe('CustomTextInput', () => {
  let mockOnChange;
  let mockOnValidation;
  let user;

  beforeEach(() => {
    mockOnChange = vi.fn();
    mockOnValidation = vi.fn();
    user = userEvent.setup();
  });

  it('renders with default state', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'test-input');
  });

  it('displays label with required indicator', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        required
      />
    );

    expect(screen.getByText('Enter text')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        error="This field is required"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        helperText="This is helpful information"
      />
    );

    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');

    expect(mockOnChange).toHaveBeenCalledTimes(5); // Once for each character
  });

  it('validates input on change when enabled', async () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        validateOnChange
        onValidation={mockOnValidation}
        minLength={3}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hi');

    expect(mockOnValidation).toHaveBeenCalled();
  });

  it('validates on blur', async () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        onValidation={mockOnValidation}
        required
      />
    );

    const input = screen.getByRole('textbox');
    
    // Focus and blur
    await user.click(input);
    await user.tab(); // This will blur the input

    expect(mockOnValidation).toHaveBeenCalled();
  });

  it('respects disabled state', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        required
        error="Error message"
        helperText="Helper text"
      />
    );

    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('supports different input types', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter email"
        name="email-input"
        type="email"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('respects maxLength attribute', () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        maxLength={10}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxlength', '10');
  });

  it('sanitizes input when enabled', async () => {
    const { sanitizeInput } = await import('../../utils/validation');
    
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
        sanitize
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '<script>alert("xss")</script>');

    expect(sanitizeInput).toHaveBeenCalled();
  });

  it('handles focus and blur events', async () => {
    render(
      <CustomTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text"
        name="test-input"
      />
    );

    const input = screen.getByRole('textbox');
    
    await user.click(input);
    // Focus state should be handled internally
    
    await user.tab();
    // Blur state should be handled internally
  });
});
