const DEFAULT_SERVING = '1 serving';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const normalizeNutritionResult = (raw = {}, source = 'unknown') => {
  const foodName = String(raw.foodName ?? raw.name ?? raw.label ?? 'Unknown food').trim() || 'Unknown food';

  return {
    foodName,
    calories: Math.round(toNumber(raw.calories)),
    protein: Number(toNumber(raw.protein).toFixed(1)),
    carbs: Number(toNumber(raw.carbs).toFixed(1)),
    fat: Number(toNumber(raw.fat).toFixed(1)),
    serving: String(raw.serving ?? DEFAULT_SERVING).trim() || DEFAULT_SERVING,
    confidence: toNumber(raw.confidence),
    source,
  };
};

export const fallbackNutritionForLabel = (label, confidence) => normalizeNutritionResult({
  foodName: label,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  serving: DEFAULT_SERVING,
  confidence,
}, 'local');
