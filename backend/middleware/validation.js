const { body, validationResult } = require("express-validator");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    // preserve dots in Gmail addresses to avoid changing user input (dont remove dots)
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("role")
    .optional()
    .isIn(["attendee", "organizer", "admin"])
    .withMessage("Role must be attendee, organizer, or admin"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
];

// Login validation rules
const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Change password validation rules
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// Profile update validation rules
const profileUpdateValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio cannot be more than 500 characters"),
];

// Event validation rules
const eventValidation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage("Description must be between 20 and 5000 characters"),
  body("category")
    .isIn([
      "conference",
      "workshop",
      "seminar",
      "networking",
      "concert",
      "festival",
      "sports",
      "exhibition",
      "webinar",
      "meetup",
      "other",
    ])
    .withMessage("Invalid category"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").isISO8601().withMessage("Invalid end date"),
  body("venue.type")
    .isIn(["physical", "online", "hybrid"])
    .withMessage("Invalid venue type"),
  body("ticketTypes")
    .isArray({ min: 1 })
    .withMessage("At least one ticket type is required"),
  body("ticketTypes.*.name")
    .trim()
    .notEmpty()
    .withMessage("Ticket type name is required"),
  body("ticketTypes.*.price")
    .isNumeric({ min: 0 })
    .withMessage("Ticket price must be a positive number"),
  body("ticketTypes.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Ticket quantity must be at least 1"),
];

// Booking validation rules
const bookingValidation = [
  body("eventId").isMongoId().withMessage("Invalid event ID"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one ticket item is required"),
  body("items.*.ticketTypeId")
    .isMongoId()
    .withMessage("Invalid ticket type ID"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("attendees")
    .isArray({ min: 1 })
    .withMessage("At least one attendee is required"),
  body("attendees.*.firstName")
    .trim()
    .notEmpty()
    .withMessage("Attendee first name is required"),
  body("attendees.*.lastName")
    .trim()
    .notEmpty()
    .withMessage("Attendee last name is required"),
  body("attendees.*.email")
    .isEmail()
    .withMessage("Valid attendee email is required"),
  body("paymentMethod")
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer"])
    .withMessage("Invalid payment method"),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  profileUpdateValidation,
  eventValidation,
  bookingValidation,
};
