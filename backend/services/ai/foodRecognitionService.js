import { AI_CONFIDENCE_THRESHOLD } from './config.js';
import { runAnthropicFoodRecognition } from './anthropicRecognizer.js';
import { runLocalTfliteRecognition } from './localTfliteRecognizer.js';

export const recognizeFoodFromImage = async ({ imageBuffer, mimeType }) => {
  console.log("=== FOOD RECOGNITION START ===");
  console.log("Image size:", imageBuffer?.length);
  console.log("Mime type:", mimeType);

  let local;
  try {
    console.log("Running LOCAL TFLite...");
    local = await runLocalTfliteRecognition({ imageBuffer, mimeType });
    console.log("LOCAL RESULT:", local);
  } catch (err) {
    console.error("LOCAL TFLite CRASH:");
    console.error(err);
    local = { success: false, message: err.message };
  }

  if (local.success && local.data?.confidence >= AI_CONFIDENCE_THRESHOLD) {
    console.log("Using LOCAL result (high confidence)");
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

  console.log("Local failed or low confidence → switching to Anthropic");

  let anthropic;
  try {
    anthropic = await runAnthropicFoodRecognition({ imageBuffer, mimeType });
    console.log("ANTHROPIC RESULT:", anthropic);
  } catch (err) {
    console.error("ANTHROPIC CRASH:");
    console.error(err);
    anthropic = { success: false, message: err.message };
  }

  if (!anthropic.success) {
    console.log("Both AI systems failed");

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

  console.log("Using ANTHROPIC result");

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
