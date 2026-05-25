const axios = require('axios');
const fs = require('fs');
const env = require('../config/env');

function getApiKey() {
  const key = env.deepseekApiKey;
  if (!key || key === 'sk-your-deepseek-api-key') {
    const error = new Error('DeepSeek API key belum dikonfigurasi');
    error.statusCode = 500;
    throw error;
  }
  return key;
}

async function parseReceipt(imagePath) {
  const apiKey = getApiKey();
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `You are a receipt parser. Extract information from this receipt image.
Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "store_name": "string or null",
  "date": "string ISO date or null",
  "items": [{"name": "string", "price": number}],
  "total_amount": number,
  "payment_method": "string or null"
}

Rules:
- store_name: Name of store/business. If can't determine, use null.
- date: Parse into YYYY-MM-DD format. If can't determine, use null.
- items: Array of items purchased. Each item has name (string) and price (number). If can't determine items, use empty array.
- total_amount: The total amount paid (number, no currency symbols). This is REQUIRED - if you can see any number, use it. If truly can't find, use 0.
- payment_method: Cash, QRIS, Debit, Credit, or null.
- If the image is not a receipt, return: {"error": "Bukan struk atau gambar tidak jelas"}`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a precise receipt parser. You ONLY return valid JSON. No explanations, no markdown, no extra text. If the image is unclear or not a receipt, return {"error": "message"}.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
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
      },
    };
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw new Error('DeepSeek API key tidak valid');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Koneksi ke DeepSeek timeout');
    }
    if (err instanceof SyntaxError) {
      return { success: false, error: 'Gagal memproses data dari struk' };
    }
    throw err;
  }
}

async function verifyPaymentProof(imagePath, expectedAmount) {
  const apiKey = getApiKey();
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `You are a payment proof verifier. Analyze this transfer receipt/bukti transfer image.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "valid": boolean,
  "detected_amount": number or null,
  "detected_purpose": "string or null",
  "reason": "string or null"
}

Rules:
- valid: true ONLY if this is a legitimate transfer receipt/bukti transfer with a clear amount
- detected_amount: The amount shown in the receipt (number, remove dots/commas). null if can't determine.
- detected_purpose: The purpose/description of payment if visible
- reason: If valid is false, explain why (e.g. "Bukan bukti transfer", "Jumlah tidak terbaca")
- Expected payment amount: ${expectedAmount}

Compare detected_amount with the expected amount (${expectedAmount}). If they match (within reasonable range), set valid to true.`;

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a payment proof verification system. You ONLY return valid JSON. No explanations, no markdown.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
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
      throw new Error('DeepSeek API key tidak valid');
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Koneksi ke DeepSeek timeout');
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
