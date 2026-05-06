import json
import math
import os
import sys

import numpy as np
from PIL import Image


def load_interpreter():
    try:
        from ai_edge_litert.interpreter import Interpreter
        return Interpreter
    except Exception:
        pass

    try:
        from tflite_runtime.interpreter import Interpreter
        return Interpreter
    except Exception:
        pass

    try:
        from tensorflow.lite.python.interpreter import Interpreter
        return Interpreter
    except Exception as exc:
        raise RuntimeError(
            "No TFLite interpreter is installed. Run `python -m pip install -r requirements.txt`."
        ) from exc


def respond(payload, exit_code=0):
    print(json.dumps(payload), flush=True)
    sys.exit(exit_code)


def read_labels(path):
    with open(path, "r", encoding="utf-8") as file:
        return [line.strip() for line in file if line.strip()]


def read_nutrition(path):
    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return {}


def normalize_image(image, input_details):
    size = int(os.environ.get("AI_MODEL_INPUT_SIZE", "224"))
    normalization = os.environ.get("AI_MODEL_NORMALIZATION", "minus-one-to-one")

    input_shape = input_details["shape"]
    target_height = int(input_shape[1]) if len(input_shape) == 4 and input_shape[1] else size
    target_width = int(input_shape[2]) if len(input_shape) == 4 and input_shape[2] else size
    dtype = input_details["dtype"]

    image = image.convert("RGB").resize((target_width, target_height))
    array = np.asarray(image)

    if dtype == np.float32:
        array = array.astype(np.float32)
        if normalization == "zero-to-one":
            array = array / 255.0
        elif normalization == "minus-one-to-one":
            array = (array / 127.5) - 1.0
    else:
        array = array.astype(dtype)

    return np.expand_dims(array, axis=0)


def dequantize_output(output, output_details):
    scale, zero_point = output_details.get("quantization", (0.0, 0))
    if scale:
        return (output.astype(np.float32) - float(zero_point)) * float(scale)
    return output.astype(np.float32)


def softmax(values):
    values = np.asarray(values, dtype=np.float32).reshape(-1)
    values = values - np.max(values)
    exp = np.exp(values)
    total = np.sum(exp)
    if not math.isfinite(float(total)) or total <= 0:
        return values
    return exp / total


def confidence_scores(output):
    values = np.asarray(output, dtype=np.float32).reshape(-1)
    if np.min(values) < 0 or np.max(values) > 1.0 or abs(float(np.sum(values)) - 1.0) > 0.05:
        return softmax(values)
    return values


def main():
    model_path = os.environ["AI_MODEL_PATH"]
    labels_path = os.environ["AI_LABELS_PATH"]
    nutrition_path = os.environ["AI_NUTRITION_PATH"]

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        respond({
            "success": False,
            "message": f"Image file not found: {image_path}",
            "data": None
        }, 1)

    labels = read_labels(labels_path)
    nutrition = read_nutrition(nutrition_path)

    Interpreter = load_interpreter()
    interpreter = Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()[0]
    output_details = interpreter.get_output_details()[0]

    image = Image.open(io.BytesIO(image_bytes))
    input_tensor = normalize_image(image, input_details)
    interpreter.set_tensor(input_details["index"], input_tensor)
    interpreter.invoke()

    output = interpreter.get_tensor(output_details["index"])
    output = dequantize_output(output, output_details)
    scores = confidence_scores(output)

    class_index = int(np.argmax(scores))
    confidence = float(scores[class_index])
    label = labels[class_index] if class_index < len(labels) else None

    if not label:
        respond({
            "success": False,
            "message": f"No label found for local model class {class_index}.",
            "data": None,
        }, 1)

    nutrition_for_label = nutrition.get(label) or nutrition.get(label.lower())
    if not nutrition_for_label:
        respond({
            "success": False,
            "message": f'No local nutrition mapping found for "{label}".',
            "data": None,
        }, 1)

    data = {
        "foodName": label,
        "calories": round(float(nutrition_for_label.get("calories", 0))),
        "protein": round(float(nutrition_for_label.get("protein", 0)), 1),
        "carbs": round(float(nutrition_for_label.get("carbs", 0)), 1),
        "fat": round(float(nutrition_for_label.get("fat", 0)), 1),
        "serving": nutrition_for_label.get("serving", "1 serving"),
        "confidence": confidence,
        "source": "local",
    }

    respond({
        "success": True,
        "data": data,
        "meta": {
            "classIndex": class_index,
            "modelPath": model_path,
            "labelsPath": labels_path,
            "nutritionPath": nutrition_path,
        },
    })


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        respond({"success": False, "message": str(exc), "data": None}, 1)
