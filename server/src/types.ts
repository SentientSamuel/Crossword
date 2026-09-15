export type Direction = 'across' | 'down';

/** A single clue in the puzzle, including its answer (server-side only). */
export interface Clue {
  number: number;
  direction: Direction;
  text: string;
  row: number;
  col: number;
  length: number;
  answer: string;
}

/** Full puzzle definition held on the server, including the solution. */
export interface PuzzleDefinition {
  id: string;
  title: string;
  author: string;
  rows: number;
  cols: number;
  /** Uppercase solution letters; `null` marks a blocked (black) cell. */
  solution: (string | null)[][];
  clues: Clue[];
}

/** A cell as exposed to the client (no solution letter). */
export interface PublicCell {
  row: number;
  col: number;
  block: boolean;
  number: number | null;
}

/** A clue as exposed to the client (no answer). */
export interface PublicClue {
  number: number;
  direction: Direction;
  text: string;
  row: number;
  col: number;
  length: number;
}

export interface PublicPuzzle {
  id: string;
  title: string;
  author: string;
  rows: number;
  cols: number;
  cells: PublicCell[][];
  clues: {
    across: PublicClue[];
    down: PublicClue[];
  };
}

export type CellStatus = 'correct' | 'incorrect' | 'empty';

export interface CheckRequest {
  puzzleId: string;
  /** rows x cols grid of single uppercase letters; empty string or null for blank. */
  answers: (string | null)[][];
}

export interface CheckResponse {
  puzzleId: string;
  statuses: CellStatus[][];
  solved: boolean;
  correctCount: number;
  fillableCount: number;
}
