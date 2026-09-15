import type { Clue, PuzzleDefinition, PublicPuzzle } from './types.js';

interface PuzzleSpec {
  id: string;
  title: string;
  author: string;
  /** Rows of the solution. Use uppercase letters for cells and '.' for blocks. */
  layout: string[];
  clues: {
    across: Record<number, string>;
    down: Record<number, string>;
  };
}

const isBlock = (grid: (string | null)[][], r: number, c: number): boolean => {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return true;
  return grid[r][c] === null;
};

/**
 * Build a full puzzle definition (with numbering, clue positions, lengths and
 * answers) from a compact spec. Numbering follows standard crossword rules:
 * left-to-right, top-to-bottom, incrementing whenever a cell begins an across
 * or down word.
 */
function buildPuzzle(spec: PuzzleSpec): PuzzleDefinition {
  const solution: (string | null)[][] = spec.layout.map((row) =>
    row.split('').map((ch) => (ch === '.' ? null : ch.toUpperCase())),
  );

  const rows = solution.length;
  const cols = solution[0].length;
  const clues: Clue[] = [];
  let number = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isBlock(solution, r, c)) continue;

      const startsAcross =
        isBlock(solution, r, c - 1) && !isBlock(solution, r, c + 1);
      const startsDown =
        isBlock(solution, r - 1, c) && !isBlock(solution, r + 1, c);

      if (!startsAcross && !startsDown) continue;

      number += 1;

      if (startsAcross) {
        let length = 0;
        let answer = '';
        while (!isBlock(solution, r, c + length)) {
          answer += solution[r][c + length];
          length += 1;
        }
        const text = spec.clues.across[number];
        if (!text) {
          throw new Error(`Missing across clue text for number ${number}`);
        }
        clues.push({ number, direction: 'across', text, row: r, col: c, length, answer });
      }

      if (startsDown) {
        let length = 0;
        let answer = '';
        while (!isBlock(solution, r + length, c)) {
          answer += solution[r + length][c];
          length += 1;
        }
        const text = spec.clues.down[number];
        if (!text) {
          throw new Error(`Missing down clue text for number ${number}`);
        }
        clues.push({ number, direction: 'down', text, row: r, col: c, length, answer });
      }
    }
  }

  return {
    id: spec.id,
    title: spec.title,
    author: spec.author,
    rows,
    cols,
    solution,
    clues,
  };
}

/**
 * The starter puzzle is a 5x5 double word square: every row and every column
 * spells a valid word, so the grid interlocks perfectly with no black squares.
 */
const miniSpec: PuzzleSpec = {
  id: 'mini-1',
  title: 'The Daily Mini',
  author: 'Crossword Studio',
  layout: [
    'HEART',
    'EMBER',
    'ABUSE',
    'RESIN',
    'TRENT',
  ],
  clues: {
    across: {
      1: 'Organ that pumps blood',
      6: 'Glowing remnant of a fire',
      7: 'Mistreat or misuse',
      8: 'Sticky secretion from pine trees',
      9: 'English river flowing through Nottingham',
    },
    down: {
      1: 'Seat of the emotions',
      2: 'Smoldering coal in a grate',
      3: 'Improper or excessive use',
      4: 'Raw material of natural amber',
      5: 'River in the English Midlands',
    },
  },
};

const puzzles: Map<string, PuzzleDefinition> = new Map(
  [buildPuzzle(miniSpec)].map((puzzle) => [puzzle.id, puzzle]),
);

export function getPuzzle(id: string): PuzzleDefinition | undefined {
  return puzzles.get(id);
}

export function getDefaultPuzzle(): PuzzleDefinition {
  return puzzles.get('mini-1')!;
}

/** Strip solution letters and answers, exposing only what the client needs. */
export function toPublicPuzzle(puzzle: PuzzleDefinition): PublicPuzzle {
  const numberAt = new Map<string, number>();
  for (const clue of puzzle.clues) {
    numberAt.set(`${clue.row},${clue.col}`, clue.number);
  }

  const cells = puzzle.solution.map((row, r) =>
    row.map((cell, c) => ({
      row: r,
      col: c,
      block: cell === null,
      number: numberAt.get(`${r},${c}`) ?? null,
    })),
  );

  return {
    id: puzzle.id,
    title: puzzle.title,
    author: puzzle.author,
    rows: puzzle.rows,
    cols: puzzle.cols,
    cells,
    clues: {
      across: puzzle.clues
        .filter((clue) => clue.direction === 'across')
        .map(({ answer: _answer, ...rest }) => rest),
      down: puzzle.clues
        .filter((clue) => clue.direction === 'down')
        .map(({ answer: _answer, ...rest }) => rest),
    },
  };
}
