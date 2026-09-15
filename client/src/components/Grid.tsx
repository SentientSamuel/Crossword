import type { CellStatus, PublicPuzzle } from '../types';
import type { Coord } from '../crossword';

interface GridProps {
  puzzle: PublicPuzzle;
  entries: string[][];
  statuses: CellStatus[][] | null;
  selected: Coord;
  wordKeys: Set<string>;
  onSelectCell: (row: number, col: number) => void;
}

export function Grid({
  puzzle,
  entries,
  statuses,
  selected,
  wordKeys,
  onSelectCell,
}: GridProps) {
  return (
    <div
      className="grid"
      role="grid"
      aria-label={`${puzzle.title} crossword grid`}
      style={{
        gridTemplateColumns: `repeat(${puzzle.cols}, var(--cell-size))`,
        gridTemplateRows: `repeat(${puzzle.rows}, var(--cell-size))`,
      }}
    >
      {puzzle.cells.map((row) =>
        row.map((cell) => {
          if (cell.block) {
            return (
              <div
                key={`${cell.row}-${cell.col}`}
                className="cell cell--block"
                role="gridcell"
                aria-hidden="true"
              />
            );
          }

          const isSelected =
            selected.row === cell.row && selected.col === cell.col;
          const inWord = wordKeys.has(`${cell.row},${cell.col}`);
          const status = statuses?.[cell.row]?.[cell.col];
          const letter = entries[cell.row]?.[cell.col] ?? '';

          const classes = ['cell'];
          if (inWord) classes.push('cell--highlight');
          if (isSelected) classes.push('cell--selected');
          if (status === 'correct') classes.push('cell--correct');
          if (status === 'incorrect') classes.push('cell--incorrect');

          return (
            <button
              type="button"
              key={`${cell.row}-${cell.col}`}
              className={classes.join(' ')}
              role="gridcell"
              aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}${
                letter ? `, ${letter}` : ', empty'
              }`}
              aria-selected={isSelected}
              tabIndex={-1}
              onClick={() => onSelectCell(cell.row, cell.col)}
            >
              {cell.number !== null && (
                <span className="cell__number">{cell.number}</span>
              )}
              <span className="cell__letter">{letter}</span>
            </button>
          );
        }),
      )}
    </div>
  );
}
