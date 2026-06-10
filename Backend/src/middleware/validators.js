import { body, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = {};
    errors.array().forEach((error) => {
      if (error.path) {
        errorMessages[error.path] = error.msg;
      }
    });
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};

export const validateRegister = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is verplicht")
    .isLength({ min: 2 })
    .withMessage("Username moet minimaal 2 tekens bevatten"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is verplicht")
    .isEmail()
    .withMessage("Voeg een geldig emailadres in"),
  body("password")
    .notEmpty()
    .withMessage("Wachtwoord is verplicht")
    .isLength({ min: 8 })
    .withMessage("Wachtwoord moet minimaal 8 tekens bevatten"),
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is verplicht")
    .isEmail()
    .withMessage("Voeg een geldig emailadres in"),
  body("password").notEmpty().withMessage("Wachtwoord is verplicht"),
];
