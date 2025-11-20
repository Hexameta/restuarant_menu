/**
 * Error Handler Utility
 * Formats error responses consistently across the application
 */

const errorHandler = (error) => {
  // Joi validation error
  if (error.isJoi) {
    return {
      status: "error",
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    };
  }

  // Sequelize validation error
  if (error.name === "SequelizeValidationError") {
    return {
      status: "error",
      success: false,
      message: "Database validation error",
      errors: error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      })),
    };
  }

  // Sequelize unique constraint error
  if (error.name === "SequelizeUniqueConstraintError") {
    return {
      status: "error",
      success: false,
      message: "Duplicate entry found",
      errors: error.errors.map((err) => ({
        field: err.path,
        message: `${err.path} already exists`,
      })),
    };
  }

  // Default error format
  return {
    status: "error",
    success: false,
    message: error.message || "An unexpected error occurred",
  };
};

module.exports = errorHandler;
