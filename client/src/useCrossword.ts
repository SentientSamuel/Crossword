import { useCallback, useEffect, useMemo, useState } from 'react';
import { checkAnswers, fetchPuzzle, revealSolution } from './api';
import {
  emptyGrid,
  firstFillableCell,
  getClueForCell,
  getWordCells,
  isBlock,
  moveInDirection,
  nextCellInWord,
  prevCellInWord,
  type Coord,
} from './crossword';
import type { CellStatus, Direction, PublicClue, PublicPuzzle } from './types';

export interface CrosswordApi {
  puzzle: PublicPuzzle | null;
  loading: boolean;
  error: string | null;
  entries: string[][];
  statuses: (CellStatus[][]) | null;
  selected: Coord;
  direction: Direction;
  solved: boolean;
  checking: boolean;
  message: string | null;
  elapsedSeconds: number;
  activeClue: PublicClue | null;
  wordKeys: Set<string>;
  selectCell: (row: number, col: number) => void;
  selectClue: (clue: PublicClue) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  check: () => Promise<void>;
  reveal: () => Promise<void>;
  clear: () => void;
}

const keyOf = (row: number, col: number) => `${row},${col}`;

export function useCrossword(): CrosswordApi {
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<string[][]>([]);
  const [statuses, setStatuses] = useState<CellStatus[][] | null>(null);
  const [selected, setSelected] = useState<Coord>({ row: 0, col: 0 });
  const [direction, setDirection] = useState<Direction>('across');
  const [solved, setSolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Load the puzzle once on mount.
  useEffect(() => {
    const controller = new AbortController();
    fetchPuzzle(controller.signal)
      .then((loaded) => {
        setPuzzle(loaded);
        setEntries(emptyGrid(loaded));
        setSelected(firstFillableCell(loaded));
        setDirection('across');
        setStartedAt(Date.now());
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load puzzle');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Timer: ticks until the puzzle is solved.
  useEffect(() => {
    if (startedAt === null || solved) return;
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, solved]);

  const activeClue = useMemo(() => {
    if (!puzzle) return null;
    return getClueForCell(puzzle, selected.row, selected.col, direction);
  }, [puzzle, selected, direction]);

  const wordKeys = useMemo(() => {
    if (!puzzle) return new Set<string>();
    const cells = getWordCells(puzzle, selected.row, selected.col, direction);
    return new Set(cells.map((cell) => keyOf(cell.row, cell.col)));
  }, [puzzle, selected, direction]);

  const clearFeedback = useCallback(() => {
    setStatuses(null);
    setSolved(false);
    setMessage(null);
  }, []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (!puzzle || isBlock(puzzle, row, col)) return;
      setSelected((prev) => {
        if (prev.row === row && prev.col === col) {
          setDirection((d) => (d === 'across' ? 'down' : 'across'));
        }
        return { row, col };
      });
    },
    [puzzle],
  );

  const selectClue = useCallback((clue: PublicClue) => {
    setDirection(clue.direction);
    setSelected({ row: clue.row, col: clue.col });
  }, []);

  const writeLetter = useCallback(
    (letter: string) => {
      if (!puzzle) return;
      setEntries((prev) => {
        const next = prev.map((r) => r.slice());
        next[selected.row][selected.col] = letter;
        return next;
      });
      clearFeedback();
      const nextCell = nextCellInWord(puzzle, selected.row, selected.col, direction);
      setSelected(nextCell);
    },
    [puzzle, selected, direction, clearFeedback],
  );

  const deleteLetter = useCallback(() => {
    if (!puzzle) return;
    const current = entries[selected.row]?.[selected.col] ?? '';
    clearFeedback();
    if (current !== '') {
      setEntries((prev) => {
        const next = prev.map((r) => r.slice());
        next[selected.row][selected.col] = '';
        return next;
      });
      return;
    }
    const prevCell = prevCellInWord(puzzle, selected.row, selected.col, direction);
    setEntries((prev) => {
      const next = prev.map((r) => r.slice());
      next[prevCell.row][prevCell.col] = '';
      return next;
    });
    setSelected(prevCell);
  }, [puzzle, entries, selected, direction, clearFeedback]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!puzzle) return;
      const { key } = event;

      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        writeLetter(key.toUpperCase());
        return;
      }

      switch (key) {
        case 'Backspace':
          event.preventDefault();
          deleteLetter();
          break;
        case 'Delete':
          event.preventDefault();
          setEntries((prev) => {
            const next = prev.map((r) => r.slice());
            next[selected.row][selected.col] = '';
            return next;
          });
          clearFeedback();
          break;
        case ' ':
          event.preventDefault();
          setDirection((d) => (d === 'across' ? 'down' : 'across'));
          break;
        case 'ArrowRight':
          event.preventDefault();
          setDirection('across');
          setSelected(moveInDirection(puzzle, selected.row, selected.col, 0, 1));
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setDirection('across');
          setSelected(moveInDirection(puzzle, selected.row, selected.col, 0, -1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setDirection('down');
          setSelected(moveInDirection(puzzle, selected.row, selected.col, 1, 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setDirection('down');
          setSelected(moveInDirection(puzzle, selected.row, selected.col, -1, 0));
          break;
        default:
          break;
      }
    },
    [puzzle, selected, writeLetter, deleteLetter, clearFeedback],
  );

  const check = useCallback(async () => {
    if (!puzzle) return;
    setChecking(true);
    setMessage(null);
    try {
      const result = await checkAnswers(puzzle.id, entries);
      setStatuses(result.statuses);
      setSolved(result.solved);
      if (result.solved) {
        setMessage('Solved! Every answer is correct.');
      } else {
        const remaining = result.fillableCount - result.correctCount;
        setMessage(`${result.correctCount}/${result.fillableCount} correct — ${remaining} to go.`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  }, [puzzle, entries]);

  const reveal = useCallback(async () => {
    if (!puzzle) return;
    setChecking(true);
    try {
      const { solution } = await revealSolution(puzzle.id);
      setEntries(solution);
      setStatuses(solution.map((row) => row.map((cell) => (cell ? 'correct' : 'empty'))));
      setSolved(true);
      setMessage('Solution revealed.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Reveal failed');
    } finally {
      setChecking(false);
    }
  }, [puzzle]);

  const clear = useCallback(() => {
    if (!puzzle) return;
    setEntries(emptyGrid(puzzle));
    clearFeedback();
    setSelected(firstFillableCell(puzzle));
    setDirection('across');
    setStartedAt(Date.now());
    setElapsedSeconds(0);
  }, [puzzle, clearFeedback]);

  return {
    puzzle,
    loading,
    error,
    entries,
    statuses,
    selected,
    direction,
    solved,
    checking,
    message,
    elapsedSeconds,
    activeClue,
    wordKeys,
    selectCell,
    selectClue,
    handleKeyDown,
    check,
    reveal,
    clear,
  };
}
