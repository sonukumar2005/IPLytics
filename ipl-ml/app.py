from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Spring Boot

# Load Model and Encoders
model = joblib.load('model/match_predictor.pkl')
encoders = joblib.load('model/encoders.pkl')

@app.route('/')
def home():
    return """
    <html>
        <head>
            <title>IPL ML API</title>
            <style>
                body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; margin: 0; }
                .box { border: 1px solid #334155; padding: 20px; border-radius: 8px; }
                h1 { color: #f59e0b; margin-top: 0; }
                code { background: #1e293b; padding: 2px 5px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>IPL Predictor API</h1>
                <p>Status: <b>Online</b></p>
                <p>Endpoint: <code>POST /predict</code></p>
            </div>
        </body>
    </html>
    """

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        team1 = data.get('team1')
        team2 = data.get('team2')
        venue = data.get('venue')
        toss_winner = data.get('tossWinner')
        toss_decision = data.get('tossDecision')

        # Create input df
        input_data = pd.DataFrame([{
            'team1': team1,
            'team2': team2,
            'venue': venue,
            'toss_winner': toss_winner,
            'toss_decision': toss_decision
        }])

        # Encode inputs
        for col in ['team1', 'team2', 'venue', 'toss_winner', 'toss_decision']:
            le = encoders.get(col)
            # Handle unseen teams/venues (Simple fallback)
            try:
                input_data[col] = le.transform(input_data[col])
            except:
                input_data[col] = 0 # Default to 0 if unknown category

        # Run Prediction
        prediction_val = model.predict(input_data)[0]
        prediction_proba = model.predict_proba(input_data)[0]
        
        # Get the confidence for the predicted class
        confidence = float(max(prediction_proba))
        
        winner_le = encoders.get('winner')
        predicted_winner = winner_le.inverse_transform([prediction_val])[0]

        return jsonify({
            'predicted_winner': predicted_winner,
            'confidence': confidence
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(port=5000, debug=True)
