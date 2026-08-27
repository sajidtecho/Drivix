from ultralytics import YOLO

# Load a small pretrained YOLO model
model = YOLO("yolo11n.pt")

# Start webcam detection
model.predict(
    source=0,
    show=True,
    conf=0.5
)