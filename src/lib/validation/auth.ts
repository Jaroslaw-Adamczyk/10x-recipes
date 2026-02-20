import { z } from "zod";

/**
 * Validation schema for user registration
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Validation schema for requesting a password reset email
 */
export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Please enter a valid email address"),
});

/**
 * Validation schema for confirming password reset (set new password)
 */
export const resetPasswordConfirmSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
