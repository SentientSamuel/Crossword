import type { Direction, PublicClue, PublicPuzzle } from './types';

export interface Coord {
  row: number;
  col: number;
}

export function isBlock(puzzle: PublicPuzzle, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= puzzle.rows || col >= puzzle.cols) return true;
  return puzzle.cells[row][col].block;
}

/** Create an empty rows x cols grid of single-letter strings. */
export function emptyGrid(puzzle: PublicPuzzle): string[][] {
  return Array.from({ length: puzzle.rows }, () =>
    Array.from({ length: puzzle.cols }, () => ''),
  );
}

export function firstFillableCell(puzzle: PublicPuzzle): Coord {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (!isBlock(puzzle, r, c)) return { row: r, col: c };
    }
  }
  return { row: 0, col: 0 };
}

const step = (direction: Direction) =>
  direction === 'across' ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };

/** All cells belonging to the word through (row,col) in the given direction. */
export function getWordCells(
  puzzle: PublicPuzzle,
  row: number,
  col: number,
  direction: Direction,
): Coord[] {
  if (isBlock(puzzle, row, col)) return [];
  const { dr, dc } = step(direction);

  // Walk backwards to the start of the word.
  let startRow = row;
  let startCol = col;
  while (!isBlock(puzzle, startRow - dr, startCol - dc)) {
    startRow -= dr;
    startCol -= dc;
  }

  // Walk forwards collecting every cell in the word.
  const cells: Coord[] = [];
  let r = startRow;
  let c = startCol;
  while (!isBlock(puzzle, r, c)) {
    cells.push({ row: r, col: c });
    r += dr;
    c += dc;
  }
  return cells;
}

/** Find the clue whose word contains (row,col) for the given direction. */
export function getClueForCell(
  puzzle: PublicPuzzle,
  row: number,
  col: number,
  direction: Direction,
): PublicClue | null {
  const word = getWordCells(puzzle, row, col, direction);
  if (word.length === 0) return null;
  const start = word[0];
  const clues = direction === 'across' ? puzzle.clues.across : puzzle.clues.down;
  return (
    clues.find((clue) => clue.row === start.row && clue.col === start.col) ?? null
  );
}

/**
 * The next fillable cell from (row,col) in the given direction. Advances within
 * the current word first; if at the end of the word, stays put.
 */
export function nextCellInWord(
  puzzle: PublicPuzzle,
  row: number,
  col: number,
  direction: Direction,
): Coord {
  const { dr, dc } = step(direction);
  const r = row + dr;
  const c = col + dc;
  if (isBlock(puzzle, r, c)) return { row, col };
  return { row: r, col: c };
}

export function prevCellInWord(
  puzzle: PublicPuzzle,
  row: number,
  col: number,
  direction: Direction,
): Coord {
  const { dr, dc } = step(direction);
  const r = row - dr;
  const c = col - dc;
  if (isBlock(puzzle, r, c)) return { row, col };
  return { row: r, col: c };
}

/** Move one step in a raw grid direction, skipping over block cells. */
export function moveInDirection(
  puzzle: PublicPuzzle,
  row: number,
  col: number,
  dr: number,
  dc: number,
): Coord {
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols) {
    if (!isBlock(puzzle, r, c)) return { row: r, col: c };
    r += dr;
    c += dc;
  }
  return { row, col };
}
