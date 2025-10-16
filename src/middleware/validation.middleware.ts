import { Request, Response, NextFunction } from "express";

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check if required field is missing
      if (
        rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type) {
        if (rule.type === "array") {
          if (!Array.isArray(value)) {
            errors.push(`${rule.field} must be an array`);
            continue;
          }
        } else if (rule.type === "object") {
          if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
          ) {
            errors.push(`${rule.field} must be an object`);
            continue;
          }
        } else {
          if (typeof value !== rule.type) {
            errors.push(`${rule.field} must be of type ${rule.type}`);
            continue;
          }
        }
      }

      // String validations
      if (rule.type === "string" && typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(
            `${rule.field} must be at least ${rule.minLength} characters long`
          );
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(
            `${rule.field} must be no more than ${rule.maxLength} characters long`
          );
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    next();
  };
};

// Common validation rules
export const documentValidation = {
  create: validateRequest([
    {
      field: "title",
      required: true,
      type: "string" as const,
      minLength: 1,
      maxLength: 100,
    },
  ]),
  update: validateRequest([
    { field: "title", type: "string" as const, minLength: 1, maxLength: 100 },
    { field: "collaborators", type: "array" as const },
  ]),
};
