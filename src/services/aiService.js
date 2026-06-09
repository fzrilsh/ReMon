const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const env = require('../config/env');

function getApiKey() {
  const key = env.aiApiKey;
  if (!key || key === 'sk-your-api-key') {
    const error = new Error('AI API key belum dikonfigurasi');
    error.statusCode = 500;
    throw error;
  }
  return key;
}

async function ocrImage(imagePath) {
  const worker = await createWorker('eng+ind');
  try {
    const { data } = await worker.recognize(imagePath);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function parseReceipt(imagePath) {
  const apiKey = getApiKey();

  // Step 1: OCR the image
  let ocrText;
  try {
    ocrText = await ocrImage(imagePath);
  } catch (err) {
    return { success: false, error: 'Gagal membaca gambar: ' + err.message };
  }

  if (!ocrText || ocrText.trim().length < 5) {
    return { success: false, error: 'Tidak dapat membaca teks dari gambar. Pastikan gambar struk jelas.' };
  }

  // Step 2: Send OCR text to AI for parsing
  const prompt = `You are a receipt parser. Extract information from the following OCR text of a receipt.

OCR TEXT:
${ocrText}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "store_name": "string or null",
  "date": "string ISO date or null",
  "items": [{"name": "string", "price": number}],
  "total_amount": number,
  "payment_method": "string or null",
  "category_name": "string or null"
}

Rules:
- store_name: Name of store/business from the text
- date: Parse into YYYY-MM-DD format
- items: Array of items with their prices
- total_amount: The total amount paid (number). This is REQUIRED.
- payment_method: Cash, QRIS, Debit, Credit, or null
- category_name: Pick the BEST matching category from this list based on the receipt items and store name:
  ["Makanan", "Transport", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Pendidikan", "Lainnya", "Gaji", "Freelance", "Investasi"]
  Use "Makanan" for food/restaurant/cafe, "Transport" for fuel/parking/transportation, "Hiburan" for entertainment/games/cinema,
  "Belanja" for shopping/supermarket/clothing, "Tagihan" for bills/utilities, "Kesehatan" for pharmacy/hospital/clinic,
  "Pendidikan" for education/books/courses. Default to "Lainnya" if uncertain.
- If the text is not a receipt, return: {"error": "Bukan struk atau gambar tidak jelas"}`;

  try {
    const response = await axios.post(
      env.aiBaseUrl,
      {
        model: env.aiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a precise receipt parser. You ONLY return valid JSON. No explanations, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const choice = response.data?.choices?.[0];
    const rawContent = choice?.message?.content ?? choice?.text ?? '';
    const content = rawContent.trim();

    if (!content) {
      return { success: false, error: 'AI tidak memberikan respons' };
    }

    // Try to extract JSON: strip markdown code fences first
    let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Fallback: find first { and last } in raw content
    if (!jsonStr.startsWith('{')) {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        jsonStr = content.substring(start, end + 1);
      }
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      return { success: false, error: 'Gagal memproses data dari struk' };
    }

    if (result.error) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        store_name: result.store_name || null,
        date: result.date || null,
        items: Array.isArray(result.items) ? result.items : [],
        total_amount: typeof result.total_amount === 'number' ? result.total_amount : 0,
        payment_method: result.payment_method || null,
        category_name: result.category_name || null,
      },
    };
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw new Error('AI API key tidak valid');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Koneksi ke AI timeout');
    }
    throw err;
  }
}

async function verifyPaymentProof(imagePath, expectedAmount, expectedRecipient = null) {
  const apiKey = getApiKey();

  // Step 1: OCR the image
  let ocrText;
  try {
    ocrText = await ocrImage(imagePath);
  } catch (err) {
    return {
      valid: false,
      detectedAmount: null,
      detectedPurpose: null,
      reason: 'Gagal membaca gambar: ' + err.message,
    };
  }

  if (!ocrText || ocrText.trim().length < 5) {
    return {
      valid: false,
      detectedAmount: null,
      detectedPurpose: null,
      reason: 'Tidak dapat membaca teks dari gambar. Pastikan gambar bukti transfer jelas.',
    };
  }

  // Step 2: Send OCR text to AI for verification
  const recipientContext = expectedRecipient
    ? `Expected recipient bank  : ${expectedRecipient.bankName || '-'}
Expected account holder  : ${expectedRecipient.bankHolder || '-'}
Expected account number  : ${expectedRecipient.bankNumber || '-'}`
    : 'Expected recipient info  : Not provided (skip recipient check)';

  const prompt = `You are a payment proof verifier. Analyze this OCR text extracted from a transfer receipt/bukti transfer image.

OCR TEXT:
${ocrText}

Expected payment amount  : ${expectedAmount}
${recipientContext}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "valid": boolean,
  "detected_amount": number or null,
  "detected_recipient": "string or null",
  "detected_purpose": "string or null",
  "reason": "string or null"
}

Rules:
- valid: true ONLY if ALL of the following conditions are met:
  1. This looks like a legitimate transfer receipt/bukti transfer
  2. detected_amount matches the expected payment amount. Note: The receipt may show a Total Amount that includes an administrative fee (Biaya Admin) or a 3-digit unique code. As long as the base transfer amount matches the expected amount, it is considered valid.
  3. If expected recipient info is provided, the transfer destination (account name or number) must match the expected account holder or account number (partial match is acceptable, case-insensitive)
- detected_amount: The transfer amount found in the text (number only, no currency symbol)
- detected_recipient: The destination account name or number as detected in the receipt
- detected_purpose: The purpose/description/berita of payment if visible
- reason: Always explain briefly why valid is true or false. If false, specify which check failed (amount mismatch, wrong recipient, or not a valid receipt)`;

  try {
    const response = await axios.post(
      env.aiBaseUrl,
      {
        model: env.aiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a payment proof verification system. You ONLY return valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return {
      valid: result.valid === true,
      detectedAmount: result.detected_amount || null,
      detectedPurpose: result.detected_purpose || null,
      reason: result.reason || null,
    };
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw new Error('AI API key tidak valid');
    }
    return {
      valid: false,
      detectedAmount: null,
      detectedPurpose: null,
      reason: 'Gagal memverifikasi bukti transfer',
    };
  }
}

module.exports = { parseReceipt, verifyPaymentProof };
