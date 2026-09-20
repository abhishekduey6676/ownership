export class AnalysisLimitError extends Error {
  constructor(message: string, readonly retryAfterSeconds: number) {
    super(message);
    this.name = 'AnalysisLimitError';
  }
}
