import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws during rendering
const AsyncError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Promise((_, reject) => reject(new Error('Async error')));
  }
  return <div>No async error</div>;
};

describe('ErrorBoundary', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir şeyler ters gitti')).toBeInTheDocument();
    expect(screen.getByText('Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.')).toBeInTheDocument();
  });

  it('displays retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /tekrar dene/i })).toBeInTheDocument();
  });

  it('displays reload page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /sayfayı yenile/i })).toBeInTheDocument();
  });

  it('retries rendering when retry button is clicked', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir şeyler ters gitti')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /tekrar dene/i });
    await user.click(retryButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows error details when toggle is clicked', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const toggleButton = screen.getByRole('button', { name: /hata detaylarını göster/i });
    await user.click(toggleButton);

    expect(screen.getByText(/hata mesajı:/i)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('hides error details when toggle is clicked again', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const toggleButton = screen.getByRole('button', { name: /hata detaylarını göster/i });
    
    // Show details
    await user.click(toggleButton);
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Hide details
    await user.click(toggleButton);
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('calls custom fallback when provided', () => {
    const CustomFallback = ({ error, retry }) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });

  it('logs error information', () => {
    const mockOnError = vi.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });

  it('focuses retry button for keyboard accessibility', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /tekrar dene/i });
    expect(retryButton).toHaveFocus();
  });

  it('handles reload page button click', async () => {
    // Mock window.location.reload
    const originalReload = window.location.reload;
    window.location.reload = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /sayfayı yenile/i });
    await user.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();

    // Restore original reload function
    window.location.reload = originalReload;
  });

  it('increments retry count on multiple retries', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First retry
    const retryButton = screen.getByRole('button', { name: /tekrar dene/i });
    await user.click(retryButton);

    // Error again
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // The component should track retry count internally
    expect(screen.getByText('Bir şeyler ters gitti')).toBeInTheDocument();
  });

  it('resets error state when children change successfully', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir şeyler ters gitti')).toBeInTheDocument();

    // Rerender with different children that don't throw
    rerender(
      <ErrorBoundary>
        <div>New component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('New component')).toBeInTheDocument();
  });
});
