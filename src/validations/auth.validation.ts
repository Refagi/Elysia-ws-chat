import { z } from 'zod';

export const register = z.object({
  username: z.string().min(5, { message: 'Username must contain min 5 characters' }),
  email: z
    .string()
    .email({ message: 'Email must be a valid email address' })
    .refine((email) => email.endsWith('@gmail.com'), { message: 'Email must end with @gmail.com' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .refine((password) => /[A-Za-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: 'Password must contain at least 1 letter, 1 number, and 1 special character'
    }),
})

export const login = z.object({
  email: z
    .string()
    .email({ message: 'Email must be a valid email address' })
    .refine((email) => email.endsWith('@gmail.com'), { message: 'Email must end with @gmail.com' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .refine((password) => /[A-Za-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: 'Password must contain at least 1 letter, 1 number, and 1 special character'
    })
});

export const logout = {
  body: z.object({
    token: z.string().min(1, { message: 'refresh token must exist!' })
  })
};

export const verifyEmail = z.object({
  token: z.string().min(1, { message: 'verify token must exist!' })
})