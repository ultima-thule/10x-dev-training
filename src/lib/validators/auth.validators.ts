import { z } from "zod";

/**
 * Validation schema for user login
 *
 * Validates:
 * - email: Must be a valid email format
 * - password: Required, minimum 6 characters
 */
export const LoginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email({
      message: "Please enter a valid email address",
    }),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, {
      message: "Password must be at least 6 characters long",
    }),
});

/**
 * Validation schema for user registration
 *
 * Validates:
 * - email: Must be a valid email format
 * - password: Required, minimum 6 characters
 */
export const SignupSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email({
      message: "Please enter a valid email address",
    }),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, {
      message: "Password must be at least 6 characters long",
    }),
});

/**
 * Validation schema for password recovery request
 *
 * Validates:
 * - email: Must be a valid email format
 */
export const RecoverPasswordSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email({
      message: "Please enter a valid email address",
    }),
});

/**
 * Validation schema for password reset
 *
 * Validates:
 * - password: Required, minimum 6 characters
 * - confirmPassword: Must match password
 */
export const ResetPasswordSchema = z
  .object({
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, {
        message: "Password must be at least 6 characters long",
      }),
    confirmPassword: z.string({
      required_error: "Password confirmation is required",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Type inference from validation schemas
 */
export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type RecoverPasswordInput = z.infer<typeof RecoverPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
