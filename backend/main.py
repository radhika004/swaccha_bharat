
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import numpy as np
import cv2
import uvicorn
import os

app = FastAPI()

# CORS config for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the model weights file
# Ensure this path is correct relative to where main.py is executed.
MODEL_PATH = "runs/classify/train10/weights/best.pt"

# Check if the model file exists
if not os.path.exists(MODEL_PATH):
    print(f"Error: Model weights file not found at {MODEL_PATH}")
    print("Please ensure your 'best.pt' model file is placed in the correct directory.")
    # You might want to exit or raise an exception here if the model is critical
    model = None 
else:
    try:
        model = YOLO(MODEL_PATH)
        print(f"Successfully loaded YOLO model from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        model = None

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded. Please check backend logs."}

    contents = await file.read()
    np_array = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Could not decode image. Please upload a valid image file."}

    # Create a temporary path to save the image for YOLO processing
    # YOLO model sometimes works better with file paths than direct image objects.
    temp_dir = "temp_images"
    os.makedirs(temp_dir, exist_ok=True) # Ensure the temp directory exists
    temp_path = os.path.join(temp_dir, file.filename if file.filename else "temp_upload.jpg")
    
    try:
        cv2.imwrite(temp_path, image)
        print(f"Temporary image saved at {temp_path}")

        results = model(temp_path) # Pass the image path to the model
        
        if not results or not hasattr(results[0], 'names') or not hasattr(results[0], 'probs'):
            return {"error": "Model prediction did not return expected results structure."}

        names_dict = results[0].names
        probs = results[0].probs.data.cpu().numpy() # Ensure probs is a NumPy array

        if not probs.size: # Check if probs is empty
            return {"error": "Model returned empty probabilities."}

        predicted_class_index = np.argmax(probs)
        
        if predicted_class_index not in names_dict:
             return {"error": f"Predicted class index {predicted_class_index} not in names_dict."}

        predicted_class = names_dict[predicted_class_index]
        confidence = float(np.max(probs)) # Ensure confidence is a standard float

    except Exception as e:
        print(f"Error during prediction: {e}")
        return {"error": f"An error occurred during prediction: {str(e)}"}
    finally:
        # Clean up the temporary image file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print(f"Temporary image {temp_path} removed.")
            except Exception as e:
                print(f"Error removing temporary image {temp_path}: {e}")


    return {
        "prediction": predicted_class,
        "confidence": round(confidence, 2)
    }

if __name__ == "__main__":
    if model is None:
        print("Cannot start FastAPI server because the YOLO model failed to load.")
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)
