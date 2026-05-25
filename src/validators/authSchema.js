const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid'),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid'),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(1, 'Password wajib diisi'),
});

module.exports = { registerSchema, loginSchema };
