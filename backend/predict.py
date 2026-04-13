import sys
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import base64
import io
import os

# Paths relative to backend folder
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH  = os.path.join(BASE_DIR, 'bitewise_efficientnetb0_final_v2.h5')
LABELS_PATH = os.path.join(BASE_DIR, 'class_labels.json')

try:
    # Load model and labels
    model = tf.keras.models.load_model(MODEL_PATH)
    with open(LABELS_PATH) as f:
        labels = json.load(f)

    # Read input from stdin
    data         = json.loads(sys.stdin.read())
    base64_image = data['base64Image']

    # Decode base64 -> PIL Image -> numpy array
    image_bytes = base64.b64decode(base64_image)
    img         = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img         = img.resize((224, 224))
    img_array   = np.array(img, dtype=np.float32)
    img_array   = np.expand_dims(img_array, axis=0)

    # Run inference
    predictions = model.predict(img_array, verbose=0)
    top_idx     = int(np.argmax(predictions[0]))
    confidence  = float(np.max(predictions[0]))
    food_name   = labels[str(top_idx)]

    print(json.dumps({
        'foodName':   food_name,
        'confidence': confidence
    }))

except Exception as e:
    print(json.dumps({ 'error': str(e) }), file=sys.stderr)
    sys.exit(1)