let lastLocalMutationAt = 0;

export function markLocalMutation(): void {
  lastLocalMutationAt = Date.now();
}

export function shouldSkipRemoteSync(): boolean {
  return Date.now() - lastLocalMutationAt < 2000;
}
