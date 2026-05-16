import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL } from './config.js';
import { normalizeNutritionResult } from './nutrition.js';

const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Anthropic response did not contain JSON.');
  return JSON.parse(match[0]);
};

export const runAnthropicFoodRecognition = async ({ imageBuffer, mimeType }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      message: 'ANTHROPIC_API_KEY is not configured.',
      data: null,
    };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64Image = imageBuffer.toString('base64');

  try {
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: [
              'Identify the main food in this image and estimate nutrition for one normal serving.',
              'Return only JSON with these exact keys:',
              '{"foodName":"string","calories":number,"protein":number,"carbs":number,"fat":number,"serving":"string","confidence":number}',
              'Use confidence from 0 to 1. Do not include markdown.',
            ].join(' '),
          },
        ],
      }],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      success: true,
      data: normalizeNutritionResult(extractJson(text), 'anthropic'),
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Anthropic food recognition failed.',
      data: null,
    };
  }
};
