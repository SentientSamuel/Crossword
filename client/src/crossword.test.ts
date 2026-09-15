import { describe, expect, it } from 'vitest';
import {
  emptyGrid,
  firstFillableCell,
  getClueForCell,
  getWordCells,
  isBlock,
  moveInDirection,
  nextCellInWord,
  prevCellInWord,
} from './crossword';
import type { PublicPuzzle } from './types';

/** A tiny 2x2 puzzle used purely to exercise the grid helpers. */
const puzzle: PublicPuzzle = {
  id: 'test',
  title: 'Test',
  author: 'Test',
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
      { number: 1, direction: 'across', text: 'a', row: 0, col: 0, length: 2 },
      { number: 3, direction: 'across', text: 'b', row: 1, col: 0, length: 2 },
    ],
    down: [
      { number: 1, direction: 'down', text: 'c', row: 0, col: 0, length: 2 },
      { number: 2, direction: 'down', text: 'd', row: 0, col: 1, length: 2 },
    ],
  },
};

describe('grid helpers', () => {
  it('treats out-of-bounds coordinates as blocks', () => {
    expect(isBlock(puzzle, -1, 0)).toBe(true);
    expect(isBlock(puzzle, 0, 0)).toBe(false);
  });

  it('creates an empty grid matching the puzzle dimensions', () => {
    const grid = emptyGrid(puzzle);
    expect(grid).toHaveLength(2);
    expect(grid[0]).toEqual(['', '']);
  });

  it('finds the first fillable cell', () => {
    expect(firstFillableCell(puzzle)).toEqual({ row: 0, col: 0 });
  });

  it('collects the cells of a word', () => {
    const across = getWordCells(puzzle, 0, 1, 'across');
    expect(across).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it('maps a cell to its clue', () => {
    const clue = getClueForCell(puzzle, 0, 1, 'down');
    expect(clue?.number).toBe(2);
    expect(clue?.direction).toBe('down');
  });

  it('advances and retreats within a word', () => {
    expect(nextCellInWord(puzzle, 0, 0, 'across')).toEqual({ row: 0, col: 1 });
    expect(nextCellInWord(puzzle, 0, 1, 'across')).toEqual({ row: 0, col: 1 });
    expect(prevCellInWord(puzzle, 0, 1, 'across')).toEqual({ row: 0, col: 0 });
  });

  it('moves in a raw direction and clamps at edges', () => {
    expect(moveInDirection(puzzle, 0, 0, 0, 1)).toEqual({ row: 0, col: 1 });
    expect(moveInDirection(puzzle, 0, 0, -1, 0)).toEqual({ row: 0, col: 0 });
  });
});
