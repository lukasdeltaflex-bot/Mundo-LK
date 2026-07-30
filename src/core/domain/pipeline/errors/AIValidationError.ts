export class AIValidationError extends Error {
  public readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'AIValidationError';
    this.errors = errors;
  }
}
