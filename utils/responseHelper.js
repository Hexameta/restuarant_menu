const sendResponse = (res, statusCode, message, data = {}, pagination = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
    message: message,
    data: data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendResponse };
