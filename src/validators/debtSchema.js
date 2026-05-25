const { z } = require('zod');

const debtSchema = z.object({
  direction: z.enum(['I_OWE', 'THEY_OWE'], { required_error: 'Pilih arah hutang' }),
  otherPersonName: z
    .string({ required_error: 'Nama orang wajib diisi' })
    .min(1, 'Nama orang wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  amount: z
    .string({ required_error: 'Jumlah wajib diisi' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Jumlah harus lebih dari 0'),
  description: z
    .string({ required_error: 'Deskripsi wajib diisi' })
    .min(1, 'Deskripsi wajib diisi')
    .max(255, 'Deskripsi maksimal 255 karakter'),
  dueDate: z.string().optional().nullable(),
});

module.exports = { debtSchema };
