import os
import numpy as np
from src.feature_extractor import extract_features

def load_dataset(dataset_path):
    """
    Traverses the dataset directory and extracts features for 'Normal' and 'Depression' audio.
    
    Args:
        dataset_path (str): The root path of the dataset.
        
    Returns:
        X (np.ndarray): Feature matrix
        y (np.ndarray): Labels (0 for Normal, 1 for Depression)
    """
    X = []
    y = []
    
    classes = {'Normal': 0, 'Depression': 1}
    
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset path not found -> {dataset_path}")
        return np.array([]), np.array([])
        
    for class_name, label in classes.items():
        class_dir = os.path.join(dataset_path, class_name)
        if not os.path.exists(class_dir):
            print(f"Warning: Directory not found -> {class_dir}")
            continue
            
        count = 0
        print(f"Processing '{class_name}' audio files...")
        for root, dirs, files in os.walk(class_dir):
            for file in files:
                if file.lower().endswith(('.wav', '.mp3')):
                    file_path = os.path.join(root, file)
                    
                    # Extract features
                    features = extract_features(file_path)
                    if features is not None:
                        X.append(features)
                        y.append(label)
                        count += 1
                    
        print(f"Successfully processed {count} files for '{class_name}'.")
                    
    return np.array(X), np.array(y)
