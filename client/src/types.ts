export type Direction = 'across' | 'down';

export interface PublicCell {
  row: number;
  col: number;
  block: boolean;
  number: number | null;
}

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

export interface CheckResponse {
  puzzleId: string;
  statuses: CellStatus[][];
  solved: boolean;
  correctCount: number;
  fillableCount: number;
}
