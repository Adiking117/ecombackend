import pickle
import re
import nltk
import pandas as pd
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
import os
import sys

# Importing constants from the parent directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath, excelLocation

try:
    # Load the voting classifier from the pickle file
    with open(dirpath+'/sentiment/sentiment_analysis_model.pkl', 'rb') as f:
        loaded_model = pickle.load(f)

    # Define the functions for text preprocessing
    def convert_lower(text):
        return text.lower()

    def clean_html(text):
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)

    def remove_special(text):
        x = ''
        for i in text:
            if i.isalnum():
                x = x + i
            else:
                x = x + ' '
        return x

    # Load NLTK resources
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

    # Initialize stopwords and stemmer
    stop_words = set(stopwords.words('english'))
    stemmer = PorterStemmer()

    # Read data from the Excel file
    df = pd.read_excel(excelLocation+'/sentiments.xlsx')

    # Preprocess the reviews
    def preprocess_review(review):
        review_lower = convert_lower(review)
        review_clean = clean_html(review_lower)
        review_special_removed = remove_special(review_clean)
        review_tokenized = word_tokenize(review_special_removed.lower())
        review_no_stopwords = [word for word in review_tokenized if word not in stop_words]
        review_stemmed = [stemmer.stem(word) for word in review_tokenized]
        review_processed = ' '.join(review_stemmed)
        return review_processed

    # Preprocess all reviews and make predictions
    negative_user_ids = []
    for _, row in df.iterrows():
        review_processed = preprocess_review(row['Comment'])
        # Load the vocabulary from the trained CountVectorizer
        with open(dirpath+'/sentiment/count_vectorizer_vocab.pkl', 'rb') as f:
            vocabulary = pickle.load(f)
        
        # Vectorize the preprocessed review using the fitted vocabulary
        vectorizer = CountVectorizer(vocabulary=vocabulary)
        review_vectorized = vectorizer.transform([review_processed]).toarray() # type: ignore
        
        # Make sentiment prediction
        sentiment_prediction = loaded_model.predict(review_vectorized)
        
        # Determine sentiment label
        sentiment_label = "Positive" if sentiment_prediction == 1 else "Negative"
        
        # Print or store the sentiment prediction and user ID
        if sentiment_label == "Negative":
            negative_user_ids.append(row['User'])

    # Print user IDs with negative sentiments
    print(negative_user_ids)

except Exception as e:
    print(f"Error occurred: {str(e)}", file=sys.stderr)
