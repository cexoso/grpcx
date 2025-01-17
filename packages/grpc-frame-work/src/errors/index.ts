export class UnauthorizedError extends Error {
  status = 401;
  constructor(message?: string) {
    super();
    this.message = message ?? 'Authorization Required';
  }
}

export class Forbidden extends Error {
  status = 403;
  constructor(message?: string) {
    super();
    this.message = message ?? `you don't have permission to access this resource`;
  }
}

export class NotFound extends Error {
  status = 404;
  constructor(message?: string) {
    super();
    this.message = message ?? `Not Found`;
  }
}
