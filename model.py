import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
data = pd.read_csv("parkinsons.csv")

# ❗ REMOVE STRING COLUMN
data = data.drop("name", axis=1)

# Features & label
X = data.drop("status", axis=1)
y = data["status"]

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Accuracy
print("Accuracy:", model.score(X_test, y_test))

# Save model
joblib.dump(model, "model.pkl")
print("Model saved ✅")