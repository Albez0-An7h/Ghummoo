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

// Reads an optional query-string filter. Express parses `?status[$ne]=x` into an object, which
// would reach MongoDB as an operator; only plain strings are accepted as filter values.
function queryFilter(query, name) {
  const v = query?.[name];
  if (v === undefined || v === '') return undefined;
  if (typeof v !== 'string') throw badRequest(`Invalid ${name} filter`);
  return v;
}

module.exports = { HttpError, badRequest, notFoundErr, forbidden, conflict, queryFilter };
