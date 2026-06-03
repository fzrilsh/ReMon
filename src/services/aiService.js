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
    if (err instanceof SyntaxError) {
      return { success: false, error: 'Gagal memproses data dari struk' };
    }
    throw err;
  }
}

async function verifyPaymentProof(imagePath, expectedAmount) {
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
  const prompt = `You are a payment proof verifier. Analyze this OCR text extracted from a transfer receipt/bukti transfer image.

OCR TEXT:
${ocrText}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "valid": boolean,
  "detected_amount": number or null,
  "detected_purpose": "string or null",
  "reason": "string or null"
}

Rules:
- valid: true ONLY if this looks like a legitimate transfer receipt/bukti transfer
- detected_amount: The amount found in the text
- detected_purpose: The purpose/description of payment if visible
- reason: If valid is false, explain why
- Expected payment amount: ${expectedAmount}

Compare detected_amount with the expected amount. If they match (within reasonable range) and it appears to be a valid transfer receipt, set valid to true.`;

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
