# BiteWise AI Service

Place model assets in this folder:

- `models/bitewise_efficientnetb0_v6.tflite`
- `models/labels.txt`
- `models/nutrition.json`

`labels.txt` must be one label per line in the same class order as the TFLite model output.

`nutrition.json` maps labels to the fields the food logging UI needs:

```json
{
  "chicken rice": {
    "calories": 600,
    "protein": 35,
    "carbs": 70,
    "fat": 20,
    "serving": "1 plate"
  }
}
```

Recognition flow:

1. Run the local TFLite model through `python/recognize_food.py`.
2. Use the local result only when confidence is at least `AI_CONFIDENCE_THRESHOLD` and nutrition exists for that label.
3. Fall back to Anthropic when the local confidence is below threshold, the local model is unavailable, or local nutrition is missing.

Install local Python dependencies with:

```bash
python -m pip install -r requirements.txt
```

If Windows has more than one Python on `PATH`, set `PYTHON_BIN` in `.env` to the Python executable that has the requirements installed.
