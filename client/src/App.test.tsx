import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { PublicPuzzle } from './types';

const puzzle: PublicPuzzle = {
  id: 'test',
  title: 'Test Mini',
  author: 'Tester',
  rows: 2,
  cols: 2,
  cells: [
    [
      { row: 0, col: 0, block: false, number: 1 },
      { row: 0, col: 1, block: false, number: 2 },
    ],
    [
      { row: 1, col: 0, block: false, number: 3 },
      { row: 1, col: 1, block: false, number: null },
    ],
  ],
  clues: {
    across: [
      { number: 1, direction: 'across', text: 'First across clue', row: 0, col: 0, length: 2 },
      { number: 3, direction: 'across', text: 'Second across clue', row: 1, col: 0, length: 2 },
    ],
    down: [
      { number: 1, direction: 'down', text: 'First down clue', row: 0, col: 0, length: 2 },
      { number: 2, direction: 'down', text: 'Second down clue', row: 0, col: 1, length: 2 },
    ],
  },
};

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

const checkResponse = {
  puzzleId: 'test',
  statuses: [
    ['correct', 'correct'],
    ['correct', 'correct'],
  ],
  solved: true,
  correctCount: 4,
  fillableCount: 4,
};

beforeEach(() => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/check')) return jsonResponse(checkResponse);
    if (url.includes('/api/reveal')) {
      return jsonResponse({ puzzleId: 'test', solution: [['H', 'A'], ['I', 'T']] });
    }
    if (url.includes('/api/puzzle')) return jsonResponse(puzzle);
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the puzzle title and clues after loading', async () => {
    render(<App />);
    expect(await screen.findByText('Test Mini')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /First across clue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Second down clue/i }),
    ).toBeInTheDocument();
  });

  it('lets the user type a letter into the grid', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Mini');

    const firstCell = screen.getByRole('gridcell', {
      name: /Row 1, column 1/i,
    });
    await user.click(firstCell);
    await user.keyboard('H');

    expect(
      await screen.findByRole('gridcell', { name: /Row 1, column 1, H/i }),
    ).toBeInTheDocument();
  });

  it('checks answers and reports success', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Mini');

    await user.click(screen.getByRole('button', { name: 'Check' }));

    await waitFor(() =>
      expect(screen.getByText(/Every answer is correct/i)).toBeInTheDocument(),
    );
  });
});
