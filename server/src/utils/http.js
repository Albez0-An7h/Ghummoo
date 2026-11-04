class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const notFoundErr = (msg = 'Not found') => new HttpError(404, msg);
const forbidden = (msg = 'You do not have access to this resource') => new HttpError(403, msg);
const conflict = (msg) => new HttpError(409, msg);

module.exports = { HttpError, badRequest, notFoundErr, forbidden, conflict };
