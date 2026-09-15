import type { CellStatus, CheckResponse, PuzzleDefinition } from './types.js';

/**
 * Grade a set of user answers against the puzzle solution, returning a per-cell
 * status grid plus summary counts. Blocked cells are always reported as empty.
 */
export function gradeAnswers(
  puzzle: PuzzleDefinition,
  answers: (string | null)[][],
): CheckResponse {
  const { rows, cols, solution } = puzzle;
  const statuses: CellStatus[][] = [];
  let correctCount = 0;
  let fillableCount = 0;

  for (let r = 0; r < rows; r++) {
    const statusRow: CellStatus[] = [];
    for (let c = 0; c < cols; c++) {
      const expected = solution[r][c];

      if (expected === null) {
        statusRow.push('empty');
        continue;
      }

      fillableCount += 1;
      const raw = answers?.[r]?.[c];
      const letter = typeof raw === 'string' ? raw.trim().toUpperCase() : '';

      if (letter === '') {
        statusRow.push('empty');
      } else if (letter === expected) {
        statusRow.push('correct');
        correctCount += 1;
      } else {
        statusRow.push('incorrect');
      }
    }
    statuses.push(statusRow);
  }

  return {
    puzzleId: puzzle.id,
    statuses,
    solved: correctCount === fillableCount && fillableCount > 0,
    correctCount,
    fillableCount,
  };
}
