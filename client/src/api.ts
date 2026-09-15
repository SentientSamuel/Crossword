import type { CheckResponse, PublicPuzzle } from './types';

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function fetchPuzzle(signal?: AbortSignal): Promise<PublicPuzzle> {
  const res = await fetch('/api/puzzle', { signal });
  if (!res.ok) {
    throw new Error(`Failed to load puzzle (${res.status})`);
  }
  return (await res.json()) as PublicPuzzle;
}

export async function revealSolution(
  puzzleId: string,
): Promise<{ puzzleId: string; solution: string[][] }> {
  const res = await fetch(`/api/reveal/${encodeURIComponent(puzzleId)}`);
  if (!res.ok) {
    throw new Error(`Failed to reveal solution (${res.status})`);
  }
  return (await res.json()) as { puzzleId: string; solution: string[][] };
}

export async function checkAnswers(
  puzzleId: string,
  answers: (string | null)[][],
): Promise<CheckResponse> {
  const res = await fetch('/api/check', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ puzzleId, answers }),
  });
  if (!res.ok) {
    throw new Error(`Failed to check answers (${res.status})`);
  }
  return (await res.json()) as CheckResponse;
}
