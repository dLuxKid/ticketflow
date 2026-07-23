/**
 * Wraps an async Express route handler and forwards any rejected promise to next().
 * Eliminates the need for try/catch in every controller.
 */
const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

export default catchAsync;
