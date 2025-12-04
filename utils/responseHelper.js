const sendResponse = (res, statusCode, message, data = {}, pagination = null) => {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  
  const response = {
    status: isSuccess ? 'success' : 'error',
    success: isSuccess,
    message: message,
    data: data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendResponse };
