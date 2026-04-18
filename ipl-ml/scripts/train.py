import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_model(data_path):
    print("Training Match Predictor...")
    df = pd.read_csv(data_path)
    
    # Feature Selection
    features = ['team1', 'team2', 'venue', 'toss_winner', 'toss_decision']
    X = df[features].copy()
    y = df['winner'].copy()

    # Handling NaNs and basic cleaning
    X = X.fillna('Unknown')
    y = y.fillna('No Result')

    # Encoding Categorical Data
    encoders = {}
    for col in features:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le

    le_y = LabelEncoder()
    y = le_y.fit_transform(y)
    encoders['winner'] = le_y

    # Train Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save Model and Encoders
    if not os.path.exists('model'):
        os.makedirs('model')
        
    joblib.dump(model, 'model/match_predictor.pkl')
    joblib.dump(encoders, 'model/encoders.pkl')
    print("Successfully trained and saved model to ipl-ml/model/")

if __name__ == "__main__":
    data_file = 'data/matches.csv'
    if os.path.exists(data_file):
        train_model(data_file)
    else:
        print(f"Error: {data_file} not found. Please provide data to train.")
