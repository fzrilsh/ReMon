const { z } = require('zod');

const paySplitBillSchema = z.object({
  name: z.string({ required_error: 'Pilih nama kamu' }),
});

module.exports = { paySplitBillSchema };
