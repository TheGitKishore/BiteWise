// entities/food/FoodRecognitionResult.js
// Represents the outcome of an AI camera food recognition attempt.
// Created when a user takes a photo via the Camera Capture feature.
// Status drives what the UI shows (result, failure message, or manual prompt).

import Macronutrients from './Macronutrients';

class FoodRecognitionResult {
  constructor({
    recognitionId          = null,
    userId                 = null,
    imageUrl               = '',
    capturedAt             = null,
    recognizedFoodName     = '',
    confidence             = 0,                    // 0.0 – 1.0
    estimatedMacronutrients = new Macronutrients(),
    isConfirmed            = false,                // user tapped "Confirm"
    confirmedFoodItemId    = null,                 // linked after confirmation
    status                 = 'PENDING',            // 'PENDING' | 'CONFIRMED' | 'FAILED' | 'MANUAL_OVERRIDE'
  } = {}) {
    this.recognitionId           = recognitionId;
    this.userId                  = userId;
    this.imageUrl                = imageUrl;
    this.capturedAt              = capturedAt;
    this.recognizedFoodName      = recognizedFoodName;
    this.confidence              = confidence;
    this.estimatedMacronutrients = estimatedMacronutrients;
    this.isConfirmed             = isConfirmed;
    this.confirmedFoodItemId     = confirmedFoodItemId;
    this.status                  = status;
  }
}

export default FoodRecognitionResult;
