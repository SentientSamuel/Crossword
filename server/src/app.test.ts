import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { getDefaultPuzzle } from './puzzles.js';
import { gradeAnswers } from './grade.js';

const app = createApp();

/** Build an answers grid filled entirely with the correct solution letters. */
function solvedGrid(): string[][] {
  return getDefaultPuzzle().solution.map((row) =>
    row.map((cell) => cell ?? ''),
  );
}

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/puzzle', () => {
  it('returns the puzzle without leaking the solution', async () => {
    const res = await request(app).get('/api/puzzle');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('mini-1');
    expect(res.body.rows).toBe(5);
    expect(res.body.cols).toBe(5);
    expect(res.body.clues.across).toHaveLength(5);
    expect(res.body.clues.down).toHaveLength(5);

    // The public payload must not contain answers or solution letters.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('answer');
    expect(serialized).not.toContain('solution');

    // Numbering: cell (0,0) starts both an across and down word => number 1.
    expect(res.body.cells[0][0].number).toBe(1);
    expect(res.body.cells[1][0].number).toBe(6);
  });
});

describe('GET /api/puzzle/:id', () => {
  it('404s for an unknown puzzle', async () => {
    const res = await request(app).get('/api/puzzle/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/check', () => {
  it('marks a fully correct grid as solved', async () => {
    const res = await request(app)
      .post('/api/check')
      .send({ puzzleId: 'mini-1', answers: solvedGrid() });

    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.correctCount).toBe(25);
    expect(res.body.fillableCount).toBe(25);
    expect(res.body.statuses[0][0]).toBe('correct');
  });

  it('flags incorrect and empty cells', async () => {
    const grid = solvedGrid();
    grid[0][0] = 'X'; // wrong letter
    grid[0][1] = ''; // blank

    const res = await request(app)
      .post('/api/check')
      .send({ puzzleId: 'mini-1', answers: grid });

    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(false);
    expect(res.body.statuses[0][0]).toBe('incorrect');
    expect(res.body.statuses[0][1]).toBe('empty');
    expect(res.body.correctCount).toBe(23);
  });

  it('rejects a request without an answers grid', async () => {
    const res = await request(app).post('/api/check').send({ puzzleId: 'mini-1' });
    expect(res.status).toBe(400);
  });

  it('is case-insensitive when grading', async () => {
    const grid = solvedGrid().map((row) => row.map((cell) => cell.toLowerCase()));
    const res = await request(app)
      .post('/api/check')
      .send({ puzzleId: 'mini-1', answers: grid });
    expect(res.body.solved).toBe(true);
  });
});

describe('gradeAnswers', () => {
  it('does not mark the puzzle solved when nothing is filled', () => {
    const puzzle = getDefaultPuzzle();
    const empty = puzzle.solution.map((row) => row.map(() => ''));
    const result = gradeAnswers(puzzle, empty);
    expect(result.solved).toBe(false);
    expect(result.correctCount).toBe(0);
    expect(result.fillableCount).toBe(25);
  });
});
