import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from src.feature_extractor import extract_features

def load_dataset():
    """
    Traverses the dataset directories and extracts features for 'Normal' and 'Asthma' audio.
    
    Returns:
        X (np.ndarray): Feature matrix
        y (np.ndarray): Labels (0 for Normal, 1 for Asthma)
    """
    X = []
    y = []
    
    # Define exact paths based on workspace structure
    normal_dir = r"c:\Users\mbhav\OneDrive\Desktop\SwaasCare\Multimodel_Dataset\Audio_Dataset\Audio_Dataset\Normal"
    asthma_dir = r"c:\Users\mbhav\OneDrive\Desktop\SwaasCare\Asthma Detection Dataset Version 2\Asthma Detection Dataset Version 2\asthma"
    
    classes = {'Normal': (normal_dir, 0), 'Asthma': (asthma_dir, 1)}
    
    for class_name, (class_dir, label) in classes.items():
        if not os.path.exists(class_dir):
            print(f"Warning: Directory not found -> {class_dir}")
            continue
            
        count = 0
        print(f"Processing '{class_name}' audio files from {class_dir}...")
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
