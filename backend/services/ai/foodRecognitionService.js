import { AI_CONFIDENCE_THRESHOLD } from './config.js';
import { runAnthropicFoodRecognition } from './anthropicRecognizer.js';
import { runLocalTfliteRecognition } from './localTfliteRecognizer.js';

export const recognizeFoodFromImage = async ({ imageBuffer, mimeType }) => {
  const local = await runLocalTfliteRecognition({ imageBuffer, mimeType });

  if (local.success && local.data?.confidence >= AI_CONFIDENCE_THRESHOLD) {
    return {
      success: true,
      data: local.data,
      recognition: {
        source: 'local',
        threshold: AI_CONFIDENCE_THRESHOLD,
        localConfidence: local.data.confidence,
        fallbackUsed: false,
      },
    };
  }

  const anthropic = await runAnthropicFoodRecognition({ imageBuffer, mimeType });
  if (!anthropic.success) {
    return {
      success: false,
      message: anthropic.message || local.message || 'Food recognition failed.',
      data: null,
      recognition: {
        source: 'none',
        threshold: AI_CONFIDENCE_THRESHOLD,
        localConfidence: local.data?.confidence ?? 0,
        fallbackUsed: true,
        localError: local.success ? null : local.message,
      },
    };
  }

  return {
    success: true,
    data: anthropic.data,
    recognition: {
      source: 'anthropic',
      threshold: AI_CONFIDENCE_THRESHOLD,
      localConfidence: local.data?.confidence ?? 0,
      fallbackUsed: true,
      localError: local.success ? null : local.message,
    },
  };
};
