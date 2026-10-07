from ultralytics import YOLO

# Load pretrained YOLOv8 small
model = YOLO("/home/student/proglint/runs/detect/perfect/weights/best.pt")

# Train
model.train(
    data="05_final_dataset2/data.yaml",
    epochs=60,
    imgsz=640,
    batch=16,
    classes=[0]
)
