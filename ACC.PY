import os
from pathlib import Path
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
yaml_file = BASE_DIR / "05_final_dataset2" / "data.yaml"
if not yaml_file.exists():
    yaml_file = "/home/student/proglint/05_final_dataset/data.yaml"

# Load model (fall back to yolov8n-pose.pt or yolov8l.pt)
model_name = "yolov8l.pt" if (BASE_DIR / "yolov8l.pt").exists() else "yolov8n-pose.pt"
model = YOLO(model_name)

results = model.val(
    data=str(yaml_file),
    imgsz=640,
    batch=16,
    classes=[0]
)

print("Precision:", results.box.map)
print("Recall:", results.box.mr)
print("mAP50:", results.box.map50)
print("mAP50-95:", results.box.map)