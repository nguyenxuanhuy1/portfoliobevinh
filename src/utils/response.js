export const successResponse = (data, message = 'Success', statusCode = 200) => ({
  data,
  message,
  status: statusCode,
});

export const errorResponse = (message, statusCode = 400, errors = null) => {
  const response = { message, status: statusCode };
  if (errors) response.errors = errors;
  return response;
};

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json(successResponse(data, message, statusCode));
};

export const sendError = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json(errorResponse(message, statusCode, errors));
};

export default { successResponse, errorResponse, sendSuccess, sendError };