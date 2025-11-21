/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider, useTheme } from '../../utils/ThemeContext';

// Test component that uses the theme
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <ThemeToggle />
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'light'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn()
      })),
      writable: true
    });
  });

  test('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /passa al tema/i });
    expect(button).toBeInTheDocument();
  });

  test('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /passa al tema/i });
    const themeValue = screen.getByTestId('theme-value');

    expect(themeValue).toHaveTextContent('light');

    fireEvent.click(toggleButton);

    expect(themeValue).toHaveTextContent('dark');
  });

  test('shows correct icon based on theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initially light theme - should show moon icon
    expect(screen.getByText('MoonIcon')).toBeInTheDocument();

    // Click to toggle to dark theme
    fireEvent.click(screen.getByTestId('toggle-btn'));

    // Should show sun icon for dark theme
    expect(screen.getByText('SunIcon')).toBeInTheDocument();
  });
});