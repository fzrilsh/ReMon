const { z } = require('zod');

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'Tipe transaksi wajib dipilih' }),
  amount: z
    .string({ required_error: 'Jumlah wajib diisi' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Jumlah harus lebih dari 0'),
  description: z
    .string({ required_error: 'Deskripsi wajib diisi' })
    .min(1, 'Deskripsi wajib diisi')
    .max(255, 'Deskripsi maksimal 255 karakter'),
  categoryId: z.string().optional().nullable(),
  date: z
    .string({ required_error: 'Tanggal wajib diisi' })
    .refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
});

module.exports = { transactionSchema };
