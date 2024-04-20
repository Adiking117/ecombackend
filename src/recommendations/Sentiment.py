import re
import pandas as pd
import pickle
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module='sklearn')


STOPWORDS = set(stopwords.words("english"))

def single_prediction(predictor, scaler, cv, text_input):
    corpus = []
    stemmer = PorterStemmer()
    review = re.sub("[^a-zA-Z]", " ", text_input)
    review = review.lower().split()
    review = [stemmer.stem(word) for word in review if not word in STOPWORDS]
    review = " ".join(review)
    corpus.append(review)
    X_prediction = cv.transform(corpus).toarray()
    X_prediction_scl = scaler.transform(X_prediction)
    y_predictions = predictor.predict_proba(X_prediction_scl)
    y_predictions = y_predictions.argmax(axis=1)[0]

    if y_predictions == 1:
        return "Positive"
    elif y_predictions == 0:
        return "Negative"
    else:
        return "Neutral"

def bulk_prediction(predictor, scaler, cv, data):
    corpus = []
    stemmer = PorterStemmer()
    sentiments = []

    for i in range(0, data.shape[0]):
        review = re.sub("[^a-zA-Z]", " ", data.iloc[i]["Comment"])
        review = review.lower().split()
        review = [stemmer.stem(word) for word in review if not word in STOPWORDS]
        review = " ".join(review)
        corpus.append(review)

    X_prediction = cv.transform(corpus).toarray()
    X_prediction_scl = scaler.transform(X_prediction)
    y_predictions = predictor.predict_proba(X_prediction_scl)
    y_predictions = y_predictions.argmax(axis=1)
    sentiments = list(map(sentiment_mapping, y_predictions))

    return pd.Series(sentiments, index=data["UserId"])

def sentiment_mapping(x):
    if x == 1:
        return "Positive"
    elif x == 2:
        return "Neutral"
    else:
        return "Negative"

def main():
    predictor = pickle.load(open(r"model_xgb.pkl", "rb"))
    scaler = pickle.load(open(r"scaler.pkl", "rb"))
    cv = pickle.load(open(r"countVectorizer.pkl", "rb"))
    data = pd.read_excel("C:/Users/Aditya/Desktop/Ecomm CLG/backend/public/temp/sentiment.xlsx")
    sentiment_distribution = bulk_prediction(predictor, scaler, cv, data)
    sentiment_users = {
        "Positive": sentiment_distribution[sentiment_distribution == "Positive"].index.tolist(),
        "Neutral": sentiment_distribution[sentiment_distribution == "Neutral"].index.tolist(),
        "Negative": sentiment_distribution[sentiment_distribution == "Negative"].index.tolist()
    }
    print(sentiment_users)


if __name__ == "__main__":
    main()
