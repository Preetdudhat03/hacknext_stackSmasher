import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from src.data_loader import load_dataset
from src.model import get_model

def train_and_evaluate(model_type='random_forest', output_dir='output'):
    print(f"--- Starting Asthma Training Pipeline using {model_type} ---")
    
    # 1. Load Data
    X, y = load_dataset()
    
    if len(X) == 0:
        print("No data loaded. Please check the dataset paths in data_loader.py.")
        return
        
    print(f"Dataset loaded. Total samples: {len(X)}")
    print(f"Normal: {np.sum(y == 0)}, Asthma: {np.sum(y == 1)}")
    
    # Check if there's enough data to split
    if len(X) < 5:
        print("Dataset is too small to perform proper train-test split.")
        return
    
    # 2. Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)
    
    # 3. Scale Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Train Model
    print("Training model...")
    model = get_model(model_type)
    model.fit(X_train_scaled, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- Evaluation Metrics ---")
    print(f"Accuracy : {acc:.4f}")
    if len(np.unique(y)) > 1:
        print(f"Precision: {prec:.4f}")
        print(f"Recall   : {rec:.4f}")
        print(f"F1-Score : {f1:.4f}")
        print("\nConfusion Matrix:")
        print(cm)
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Normal', 'Asthma'] if len(np.unique(y))==2 else None))
    
    # 6. Save Model and Scaler
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    models_dir = os.path.join(output_dir, 'models')
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        
    model_path = os.path.join(models_dir, f"{model_type}_model.pkl")
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nModel saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")
    
if __name__ == "__main__":
    output_directory = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
    train_and_evaluate(model_type='random_forest', output_dir=output_directory)
