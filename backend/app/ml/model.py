from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

def get_model(model_type='random_forest'):
    """
    Returns an instantiated sklearn classifier.
    
    Args:
        model_type (str): 'random_forest' or 'logistic_regression'
        
    Returns:
        Classifier instance
    """
    if model_type == 'random_forest':
        # Using class_weight='balanced' in case of imbalanced classes
        return RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    elif model_type == 'logistic_regression':
        return LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced')
    else:
        raise ValueError(f"Model type '{model_type}' is not supported. Use 'random_forest' or 'logistic_regression'.")
