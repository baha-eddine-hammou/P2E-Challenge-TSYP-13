import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from google.colab.patches import cv2_imshow
import warnings
warnings.filterwarnings('ignore')

# Check GPU availability
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")


class MultiLeafPlantDetector:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = self._load_class_names()
        self.transform = self._get_transforms()
        self.load_model()

        self.min_leaf_area = 500
        self.max_leaf_area = 10000
        self.min_green_percentage = 5
        self.confidence_threshold = 0.6
        self.leaf_aspect_ratio_range = (0.3, 3.0)

    def _load_class_names(self):
        return ['Apple___healthy', 'Blueberry___healthy', 'Cherry___healthy', 'Corn___healthy',
                'Grape___healthy', 'Orange___Haunglongbing', 'Peach___healthy', 'Pepper___healthy',
                'Potato___healthy', 'Strawberry___healthy', 'Tomato___healthy']

    def _get_transforms(self):
        return transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def load_model(self):
        try:
            self.model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
            self.model.fc = nn.Linear(self.model.fc.in_features, len(self.class_names))
            self.model.to(self.device)
            self.model.eval()
            print("✓ PyTorch model ready")
        except Exception as e:
            print(f"✗ Model loading error: {e}")
            self.model = None

    def is_valid_leaf_region(self, mask, contour):
        area = cv2.contourArea(contour)
        if area < self.min_leaf_area or area > self.max_leaf_area:
            return False, None

        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = w / h if h > 0 else 0
        min_ar, max_ar = self.leaf_aspect_ratio_range

        if aspect_ratio < min_ar or aspect_ratio > max_ar:
            return False, None

        roi_mask = mask[y:y+h, x:x+w]
        if roi_mask.size == 0:
            return False, None

        green_density = cv2.countNonZero(roi_mask) / (w * h) if w * h > 0 else 0

        perimeter = cv2.arcLength(contour, True)
        if perimeter > 0:
            circularity = 4 * np.pi * area / (perimeter * perimeter)
        else:
            circularity = 0

        is_valid = green_density > 0.2 and 0.1 < circularity < 0.8

        leaf_info = {
            'contour': contour,
            'bbox': (x, y, w, h),
            'area': area,
            'aspect_ratio': aspect_ratio,
            'circularity': circularity,
            'green_density': green_density
        }

        return is_valid, leaf_info

    def detect_multiple_leaves(self, image):
        small = cv2.resize(image, (640, 480))
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)

        green_ranges = [
            ([35, 40, 40], [85, 255, 255]),
            ([25, 40, 40], [35, 255, 255]),
            ([85, 40, 40], [95, 255, 255]),
        ]

        combined_mask = np.zeros(small.shape[:2], dtype=np.uint8)

        for lower, upper in green_ranges:
            mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
            combined_mask = cv2.bitwise_or(combined_mask, mask)

        kernel_open = np.ones((3,3), np.uint8)
        kernel_close = np.ones((7,7), np.uint8)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_open)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel_close)

        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        leaves = []
        leaf_mask = np.zeros_like(combined_mask)

        for contour in contours:
            is_valid, leaf_info = self.is_valid_leaf_region(combined_mask, contour)
            if is_valid:
                leaves.append(leaf_info)
                cv2.drawContours(leaf_mask, [contour], -1, 255, -1)

        leaves.sort(key=lambda x: x['area'], reverse=True)

        green_pct = (cv2.countNonZero(leaf_mask) / leaf_mask.size) * 100
        return green_pct, leaves, leaf_mask, small

    def analyze_individual_leaf(self, image, leaf_info):
        x, y, w, h = leaf_info['bbox']

        leaf_roi = image[y:y+h, x:x+w]
        if leaf_roi.size == 0:
            return None

        hsv_leaf = cv2.cvtColor(leaf_roi, cv2.COLOR_BGR2HSV)

        green_channel = leaf_roi[:, :, 1]
        green_avg = np.mean(green_channel)

        gray_leaf = cv2.cvtColor(leaf_roi, cv2.COLOR_BGR2GRAY)
        disease_mask = cv2.adaptiveThreshold(gray_leaf, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY_INV, 11, 2)

        kernel = np.ones((3,3), np.uint8)
        disease_mask = cv2.morphologyEx(disease_mask, cv2.MORPH_OPEN, kernel)

        disease_pct = (np.count_nonzero(disease_mask) / disease_mask.size) * 100

        health_score = max(0, min(100, 100 - disease_pct * 2))
        health_status = "Healthy" if disease_pct < 8 else "Slight Issues" if disease_pct < 20 else "Needs Attention"

        return {
            'bbox': leaf_info['bbox'],
            'area': leaf_info['area'],
            'health_status': health_status,
            'health_score': health_score,
            'disease_pct': disease_pct,
            'green_avg': green_avg,
            'aspect_ratio': leaf_info['aspect_ratio']
        }

    def predict_health_multiple_leaves(self, image):
        try:
            green_pct, leaves, mask, processed = self.detect_multiple_leaves(image)

            if not leaves:
                return {
                    'detected': False,
                    'message': 'No leaves detected',
                    'confidence': 0.0,
                    'green_pct': green_pct,
                    'leaves': []
                }

            leaf_analyses = []
            for i, leaf_info in enumerate(leaves[:6]):
                analysis = self.analyze_individual_leaf(processed, leaf_info)
                if analysis:
                    analysis['leaf_id'] = i + 1
                    leaf_analyses.append(analysis)

            if leaf_analyses:
                avg_health = np.mean([leaf['health_score'] for leaf in leaf_analyses])
                overall_status = "Healthy" if avg_health > 80 else "Good" if avg_health > 60 else "Needs Attention"

                return {
                    'detected': True,
                    'overall_status': overall_status,
                    'avg_health_score': avg_health,
                    'confidence': max(0.6, min(0.95, avg_health / 100)),
                    'green_pct': green_pct,
                    'leaves_detected': len(leaf_analyses),
                    'leaf_analyses': leaf_analyses
                }
            else:
                return {
                    'detected': False,
                    'message': 'No valid leaves analyzed',
                    'confidence': 0.0,
                    'green_pct': green_pct,
                    'leaves': []
                }

        except Exception as e:
            return {'detected': False, 'message': f'Error: {str(e)}', 'confidence': 0.0, 'leaves': []}