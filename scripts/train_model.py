import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

# Load the Parkinson's dataset
data = pd.read_csv("parkinsons.csv", comment='#')

# We use Mean, Max, and Min Pitch which correspond to Fo, Fhi, Flo in the dataset
# This allows us to use librosa in real-time to match the dataset!
X = data[["MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)"]]
y = data["status"]  # 0 = Healthy, 1 = Parkinson's

# Train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

print(f" Parkinson's Model Accuracy: {model.score(X_test, y_test)*100:.2f}%")

joblib.dump(model, "model_parkinsons.pkl")
print("Model saved as model_parkinsons.pkl ✅")