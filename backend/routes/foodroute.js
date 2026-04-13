import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { searchFoodProduct, getNutritionInfo } from '../backend_services/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router    = express.Router();

// ── Helper: run BiteWise EfficientNetB0 model via Python ──────────
// @param  {string} base64Image
// @return {{ foodName: string, confidence: number } | null}
const runBiteWiseModel = (base64Image) => {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, '../predict.py');
    const python = spawn('py', ['-3.11', scriptPath]);

    let output = '';
    let error  = '';

    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { error  += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0 || !output) {
        console.error('[BiteWise Model] Python error:', error);
        resolve(null);
        return;
      }
      try {
        const result = JSON.parse(output.trim());
        console.log(`[BiteWise Model] ${result.foodName} (${(result.confidence * 100).toFixed(1)}%)`);
        resolve(result);
      } catch {
        resolve(null);
      }
    });

    // Send image to Python via stdin
    python.stdin.write(JSON.stringify({ base64Image }));
    python.stdin.end();
  });
};

// ── Helper: run Claude Vision fallback ────────────────────────────
const runClaudeVision = async (base64Image, mediaType) => {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: `Look at this image and identify any food or drink you can see.
Even if you are not 100% sure, make your best guess.

Respond ONLY with a JSON object:
{
  "foodName": "your best guess at the food name",
  "calories": estimated number,
  "protein": estimated grams,
  "carbs": estimated grams,
  "fat": estimated grams,
  "servingSize": "estimated serving size",
  "confidence": "high" or "medium" or "low"
}

If there is absolutely no food visible, only then respond with:
{ "error": "No food visible in image" }`,
          },
        ],
      },
    ],
  });

  const text  = response.content[0].text.trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
};

// ── UC #15, #50 — Search food by name ────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search term too short.' });
    }
    const data = await searchFoodProduct(q.trim());
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[GET /food/search]', err);
    return res.status(500).json({ success: false, message: 'Food search failed.' });
  }
});

// Premium barcode lookup
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const data = await getNutritionInfo(barcode);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[GET /food/barcode]', err);
    return res.status(500).json({ success: false, message: 'Barcode lookup failed.' });
  }
});

// ── UC #17, #52 — AI food recognition ────────────────────────────
// Flow: BiteWise model first → if confidence < 70% → Claude fallback
router.post('/recognise', async (req, res) => {
  try {
    const { base64Image, mediaType = 'image/jpeg' } = req.body;

    if (!base64Image) {
      return res.status(400).json({ success: false, message: 'No image provided.' });
    }

    // ── Step 1: Try BiteWise EfficientNetB0 model ──────────────
    const CONFIDENCE_THRESHOLD = 0.70;
    const modelResult = await runBiteWiseModel(base64Image);

    if (modelResult && modelResult.confidence >= CONFIDENCE_THRESHOLD) {
      console.log(`[Recognise] BiteWise model used — ${modelResult.foodName}`);

      // Model gives food name only — use Claude to estimate nutrition
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const nutritionRes = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Give me the estimated nutritional values for "${modelResult.foodName}" per typical serving.
Respond ONLY with JSON, no other text:
{
  "calories": number,
  "protein": grams,
  "carbs": grams,
  "fat": grams,
  "servingSize": "e.g. 1 bowl, 1 plate"
}`,
        }],
      });

      const nutritionText  = nutritionRes.content[0].text.trim();
      const nutritionClean = nutritionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const nutrition      = JSON.parse(nutritionClean);

      return res.status(200).json({
        success: true,
        source:  'bitewise_model',
        data: {
          foodName:    modelResult.foodName,
          calories:    nutrition.calories,
          protein:     nutrition.protein,
          carbs:       nutrition.carbs,
          fat:         nutrition.fat,
          servingSize: nutrition.servingSize,
          confidence:  'high',
        },
      });
    }

    // ── Step 2: Fallback to Claude Vision ─────────────────────
    const confPct = modelResult ? (modelResult.confidence * 100).toFixed(1) : 0;
    console.log(`[Recognise] BiteWise confidence too low (${confPct}%) — using Claude fallback`);

    const claudeResult = await runClaudeVision(base64Image, mediaType);

    if (claudeResult.error) {
      return res.status(200).json({
        success: false,
        message: 'Unable to identify food. Please enter manually.',
      });
    }

    return res.status(200).json({
      success: true,
      source:  'claude_vision',
      data:    claudeResult,
    });

  } catch (err) {
    console.error('[POST /food/recognise]', err);
    return res.status(500).json({ success: false, message: 'Food recognition failed.' });
  }
});

export default router;