const Joi = require("joi");

/**
 * Validator for signup request
 * Handles both new restaurant signup and branch creation for existing restaurant
 */
const signupValidator = (body) => {
  const schema = Joi.object({
    // Required fields
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
    }),

    password: Joi.string().min(8).required().label("Password").messages({
      "string.min": "Password must be at least 8 characters long",
    }),

    // Optional - if user selects existing restaurant
    restaurant_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .label("Restaurant ID"),

    // Branch details - required
    branch_name: Joi.string().required().label("Branch Name"),

    branch_phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .label("Branch Phone")
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
      }),

    country: Joi.string().required().label("Country"),

    state: Joi.string().required().label("State"),

    district: Joi.string().required().label("District"),

    city: Joi.string().required().label("City"),

    place: Joi.string().required().label("Place"),

    // Restaurant details - required only if restaurant_id is not provided
    restaurant_name: Joi.string()
      .when("restaurant_id", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .label("Restaurant Name"),

    restaurant_phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .when("restaurant_id", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .label("Restaurant Phone")
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
      }),

    restaurant_type: Joi.string()
      .valid(
        "Dine In",
        "Cafe",
        "Quick Service",
        "Food Truck",
        "Bakery",
        "Bar",
        "Fine Dining"
      )
      .when("restaurant_id", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .label("Restaurant Type"),

    logo: Joi.string().uri().optional().label("Logo URL"),
  });

  return schema.validate(body, { abortEarly: false });
};

/**
 * Validator for verify OTP request
 */
const verifyOTPValidator = (body) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
    }),

    otp: Joi.string()
      .pattern(/^\d{4}$/)
      .required()
      .label("OTP")
      .messages({
        "string.pattern.base": "OTP must be 4 digits",
      }),
  });

  return schema.validate(body, { abortEarly: false });
};

module.exports = {
  signupValidator,
  verifyOTPValidator,
};
