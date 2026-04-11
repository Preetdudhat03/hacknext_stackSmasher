import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.ensemble import RandomForestClassifier

def get_model(model_type='random_forest'):
    """
    Returns an instantiated sklearn classifier.
    
    Args:
        model_type (str): 'random_forest'
        
    Returns:
        Classifier instance
    """
    if model_type == 'random_forest':
        # Using class_weight='balanced' in case of imbalanced classes
        return RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    else:
        raise ValueError(f"Model type '{model_type}' is not supported. Use 'random_forest'.")
