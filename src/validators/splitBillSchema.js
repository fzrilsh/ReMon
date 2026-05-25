const { z } = require('zod');

const createSplitBillSchema = z.object({
  transactionId: z.string({ required_error: 'Pilih transaksi yang akan di-split' }),
  participants: z
    .string({ required_error: 'Masukkan nama peserta' })
    .transform((val) => {
      // Split by newline or comma, filter empty, trim
      return val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    })
    .refine((arr) => arr.length >= 1, 'Minimal 1 peserta'),
});

const paySplitBillSchema = z.object({
  name: z.string({ required_error: 'Pilih nama kamu' }),
});

module.exports = { createSplitBillSchema, paySplitBillSchema };
