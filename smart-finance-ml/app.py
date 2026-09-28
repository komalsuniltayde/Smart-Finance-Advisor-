from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier
import math

app = Flask(__name__)

# ── PRE-TRAINED DECISION TREE CLASSIFIER FOR HEALTH SCORE ──
# We train a DecisionTreeClassifier on synthetic savings rate dataset on startup.
# Ratings:
# - Savings Rate >= 30% -> Good (Class 2)
# - Savings Rate >= 10% and < 30% -> Neutral (Class 1)
# - Savings Rate < 10% -> Bad (Class 0)
def train_health_classifier():
    # Create synthetic savings rate points from -100 to 100
    rates = np.linspace(-100, 100, 1000).reshape(-1, 1)
    labels = []
    for r in rates:
        if r >= 30:
            labels.append(2)  # Good
        elif r >= 10:
            labels.append(1)  # Neutral
        else:
            labels.append(0)  # Bad
            
    clf = DecisionTreeClassifier(max_depth=3)
    clf.fit(rates, labels)
    return clf

health_classifier = train_health_classifier()

# ── HEALTH SCORE ENDPOINT ──
@app.route("/health", methods=["POST"])
def health():
    try:
        data = request.get_json() or {}
        income = float(data.get("income", 0))
        expense = float(data.get("expense", 0))
        
        savings_rate = ((income - expense) / income) * 100 if income > 0 else 0
        
        # Predict using scikit-learn Decision Tree Classifier
        prediction = int(health_classifier.predict([[savings_rate]])[0])
        
        rating = ""
        score = 0
        message = ""
        color = ""
        
        if prediction == 2: # Good
            rating = "Good"
            score = min(round(70 + savings_rate * 0.5), 100)
            message = "Excellent! You are saving well this month."
            color = "green"
        elif prediction == 1: # Neutral
            rating = "Neutral"
            score = round(40 + savings_rate)
            message = "Decent savings. Try to cut unnecessary expenses."
            color = "amber"
        else: # Bad
            rating = "Bad"
            score = max(round(savings_rate * 2), 10)
            message = "Warning! Your expenses are too high this month."
            color = "red"
            
        return jsonify({
            "rating": rating,
            "score": score,
            "savingsRate": round(savings_rate),
            "income": income,
            "expense": expense,
            "message": message,
            "color": color
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ── SPENDING PREDICTION ENDPOINT ──
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json() or {}
        values = data.get("values", [])
        
        n = len(values)
        if n < 2:
            return jsonify({
                "nextMonth": None,
                "trend": "insufficient data",
                "message": "Need at least 2 months of data for prediction",
                "monthsAnalyzed": n
            })
            
        # Fit Linear Regression using scikit-learn
        X = np.arange(n).reshape(-1, 1)
        y = np.array(values)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next month (index n)
        next_month = float(model.predict([[n]])[0])
        next_month = round(max(next_month, 0))
        
        # Trend analysis based on regression slope (coefficient)
        slope = float(model.coef_[0])
        trend = "stable"
        message = "📊 Your spending is stable."
        
        if slope > 500:
            trend = "increasing"
            message = "📈 Your spending is increasing. Consider reducing expenses."
        elif slope < -500:
            trend = "decreasing"
            message = "📉 Great! Your spending is decreasing month over month."
            
        return jsonify({
            "nextMonth": next_month,
            "trend": trend,
            "message": message,
            "monthsAnalyzed": n,
            "slope": round(slope),
            "values": values
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ── ANOMALY DETECTION ENDPOINT ──
@app.route("/anomalies", methods=["POST"])
def anomalies():
    try:
        data = request.get_json() or {}
        txns = data.get("transactions", [])
        
        n = len(txns)
        if n < 5:
            return jsonify({
                "anomalies": [],
                "mean": 0,
                "std": 0,
                "message": "Need more transactions for anomaly detection"
            })
            
        # Use pandas for Z-score calculation
        df = pd.DataFrame(txns)
        
        # Ensure we have the amount column and it's numeric
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
        
        mean_val = float(df["amount"].mean())
        std_val = float(df["amount"].std(ddof=0))  # Population std (matches JS calculation)
        
        # Calculate Z-score
        df["zScore"] = (df["amount"] - mean_val) / (std_val if std_val != 0 else 1)
        df["zScore_abs"] = df["zScore"].abs()
        
        # Find outliers: absolute Z-score > 2
        anomalies_df = df[df["zScore_abs"] > 2]
        
        anomalies_list = []
        for _, row in anomalies_df.iterrows():
            row_dict = row.to_dict()
            # Clean up temporary Z-score absolute and round Z-score
            del row_dict["zScore_abs"]
            row_dict["zScore"] = round(abs(row_dict["zScore"]), 2)
            # Make sure _id or dates are strings
            if "_id" in row_dict and not isinstance(row_dict["_id"], str):
                row_dict["_id"] = str(row_dict["_id"])
            anomalies_list.append(row_dict)
            
        message = "No unusual spending detected"
        if len(anomalies_list) > 0:
            message = f"Found {len(anomalies_list)} unusual transactions"
            
        return jsonify({
            "anomalies": anomalies_list,
            "mean": round(mean_val),
            "std": round(std_val),
            "message": message
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/")
def home():
    return "⚙️ FinanceAI Python ML Service is running! Express API connects here. Please access the web app at http://localhost:3000"

if __name__ == "__main__":
    # Flask ML service runs on http://localhost:8000
    app.run(port=8000, debug=True)
