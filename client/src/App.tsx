import { useEffect, useRef } from 'react';
import { useCrossword } from './useCrossword';
import { Grid } from './components/Grid';
import { CluesPanel } from './components/CluesPanel';

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function App() {
  const crossword = useCrossword();
  const boardRef = useRef<HTMLDivElement>(null);

  // Keep keyboard focus on the board so typing always lands in the grid.
  useEffect(() => {
    if (crossword.puzzle) {
      boardRef.current?.focus();
    }
  }, [crossword.puzzle]);

  if (crossword.loading) {
    return (
      <main className="app app--centered">
        <div className="loader" role="status">
          Loading puzzle…
        </div>
      </main>
    );
  }

  if (crossword.error || !crossword.puzzle) {
    return (
      <main className="app app--centered">
        <div className="error-card" role="alert">
          <h1>Unable to load the puzzle</h1>
          <p>{crossword.error ?? 'The puzzle could not be found.'}</p>
          <p className="error-card__hint">
            Make sure the API server is running on port 3001.
          </p>
        </div>
      </main>
    );
  }

  const { puzzle, activeClue, direction } = crossword;

  return (
    <main className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            #
          </span>
          <div>
            <h1 className="brand__title">{puzzle.title}</h1>
            <p className="brand__subtitle">by {puzzle.author}</p>
          </div>
        </div>
        <div className="stats">
          <div className={`timer${crossword.solved ? ' timer--done' : ''}`}>
            <span className="timer__label">Time</span>
            <span className="timer__value">
              {formatTime(crossword.elapsedSeconds)}
            </span>
          </div>
        </div>
      </header>

      <div className="layout">
        <section className="board">
          <div
            className="board__focus"
            ref={boardRef}
            tabIndex={0}
            onKeyDown={crossword.handleKeyDown}
            aria-label="Crossword board. Use arrow keys to move and type letters to fill."
          >
            <Grid
              puzzle={puzzle}
              entries={crossword.entries}
              statuses={crossword.statuses}
              selected={crossword.selected}
              wordKeys={crossword.wordKeys}
              onSelectCell={crossword.selectCell}
            />
          </div>

          <div className="active-clue" aria-live="polite">
            {activeClue ? (
              <>
                <span className="active-clue__tag">
                  {activeClue.number} {direction === 'across' ? 'Across' : 'Down'}
                </span>
                <span className="active-clue__text">{activeClue.text}</span>
              </>
            ) : (
              <span className="active-clue__text">Select a cell to begin.</span>
            )}
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void crossword.check()}
              disabled={crossword.checking}
            >
              Check
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void crossword.reveal()}
              disabled={crossword.checking}
            >
              Reveal
            </button>
            <button type="button" className="btn btn--ghost" onClick={crossword.clear}>
              Clear
            </button>
          </div>

          {crossword.message && (
            <p
              className={`message${crossword.solved ? ' message--success' : ''}`}
              role="status"
            >
              {crossword.message}
            </p>
          )}
        </section>

        <aside className="sidebar">
          <CluesPanel
            across={puzzle.clues.across}
            down={puzzle.clues.down}
            activeClue={activeClue}
            direction={direction}
            onSelectClue={crossword.selectClue}
          />
        </aside>
      </div>
    </main>
  );
}
