import type { Direction, PublicClue } from '../types';

interface CluesPanelProps {
  across: PublicClue[];
  down: PublicClue[];
  activeClue: PublicClue | null;
  direction: Direction;
  onSelectClue: (clue: PublicClue) => void;
}

function ClueList({
  title,
  direction,
  clues,
  activeClue,
  activeDirection,
  onSelectClue,
}: {
  title: string;
  direction: Direction;
  clues: PublicClue[];
  activeClue: PublicClue | null;
  activeDirection: Direction;
  onSelectClue: (clue: PublicClue) => void;
}) {
  return (
    <section className="clues" aria-label={`${title} clues`}>
      <h2 className="clues__title">{title}</h2>
      <ol className="clues__list">
        {clues.map((clue) => {
          const isActive =
            activeDirection === direction &&
            activeClue?.number === clue.number &&
            activeClue?.direction === clue.direction;
          return (
            <li key={`${clue.direction}-${clue.number}`}>
              <button
                type="button"
                className={`clue${isActive ? ' clue--active' : ''}`}
                onClick={() => onSelectClue(clue)}
                aria-current={isActive}
              >
                <span className="clue__number">{clue.number}</span>
                <span className="clue__text">{clue.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function CluesPanel({
  across,
  down,
  activeClue,
  direction,
  onSelectClue,
}: CluesPanelProps) {
  return (
    <div className="clues-panel">
      <ClueList
        title="Across"
        direction="across"
        clues={across}
        activeClue={activeClue}
        activeDirection={direction}
        onSelectClue={onSelectClue}
      />
      <ClueList
        title="Down"
        direction="down"
        clues={down}
        activeClue={activeClue}
        activeDirection={direction}
        onSelectClue={onSelectClue}
      />
    </div>
  );
}
