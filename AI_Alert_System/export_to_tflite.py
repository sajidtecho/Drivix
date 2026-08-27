import os
from ultralytics import YOLO

def main():
    print("==================================================")
    print("        Drivix YOLO TFLite Export Script")
    print("==================================================")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "yolo11n.pt")
    
    if not os.path.exists(model_path):
        print(f"❌ Error: Could not find {model_path}")
        print("Please place yolo11n.pt in this folder before running.")
        return

    print("🔄 Loading YOLO11 model...")
    model = YOLO(model_path)
    
    print("🔄 Exporting to TensorFlow Lite (TFLite) format...")
    # Export with 320x320 resolution (balanced speed & accuracy for mobile)
    # Using float16 precision for mobile GPU acceleration
    export_path = model.export(format="tflite", imgsz=320, half=True)
    
    print("\n✅ Export Complete!")
    print(f"Exported model: {export_path}")
    
    # Define destination path in mobile app assets
    dest_dir = os.path.join(os.path.dirname(current_dir), "App", "assets", "models")
    dest_path = os.path.join(dest_dir, "yolo11n.tflite")
    
    # Try to copy the file to the app assets
    src_tflite = os.path.join(current_dir, "yolo11n_saved_model", "yolo11n_full_integer_quant.tflite")
    if not os.path.exists(src_tflite):
        # Fallback to search in the export directory
        saved_model_dir = os.path.join(current_dir, "yolo11n_saved_model")
        if os.path.exists(saved_model_dir):
            for file in os.listdir(saved_model_dir):
                if file.endswith(".tflite"):
                    src_tflite = os.path.join(saved_model_dir, file)
                    break

    if os.path.exists(src_tflite):
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
        import shutil
        shutil.copy(src_tflite, dest_path)
        print(f"📦 Successfully copied model to App assets:")
        print(f"👉 {dest_path}")
    else:
        print("⚠️ Warning: Could not find the exported .tflite file to copy automatically.")
        print("Please copy it manually to App/assets/models/yolo11n.tflite")

if __name__ == "__main__":
    main()
