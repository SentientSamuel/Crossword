import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { getDefaultPuzzle, getPuzzle, toPublicPuzzle } from './puzzles.js';
import { gradeAnswers } from './grade.js';
import type { CheckRequest } from './types.js';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'crossword-server' });
  });

  app.get('/api/puzzle', (_req: Request, res: Response) => {
    res.json(toPublicPuzzle(getDefaultPuzzle()));
  });

  app.get('/api/puzzle/:id', (req: Request, res: Response) => {
    const puzzle = getPuzzle(req.params.id);
    if (!puzzle) {
      res.status(404).json({ error: `Puzzle '${req.params.id}' not found` });
      return;
    }
    res.json(toPublicPuzzle(puzzle));
  });

  app.get('/api/reveal/:id', (req: Request, res: Response) => {
    const puzzle = getPuzzle(req.params.id);
    if (!puzzle) {
      res.status(404).json({ error: `Puzzle '${req.params.id}' not found` });
      return;
    }
    res.json({
      puzzleId: puzzle.id,
      solution: puzzle.solution.map((row) => row.map((cell) => cell ?? '')),
    });
  });

  app.post('/api/check', (req: Request, res: Response) => {
    const body = req.body as Partial<CheckRequest>;
    const puzzleId = body.puzzleId ?? getDefaultPuzzle().id;
    const puzzle = getPuzzle(puzzleId);

    if (!puzzle) {
      res.status(404).json({ error: `Puzzle '${puzzleId}' not found` });
      return;
    }

    if (!Array.isArray(body.answers)) {
      res.status(400).json({ error: 'Request body must include an "answers" grid' });
      return;
    }

    res.json(gradeAnswers(puzzle, body.answers));
  });

  return app;
}
