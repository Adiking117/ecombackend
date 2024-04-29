import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import MinMaxScaler
import pickle
import warnings
import os
import sys

# Importing constants from the parent directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath, excelLocation

warnings.filterwarnings("ignore", message="X has feature names, but DecisionTreeClassifier was fitted without feature names")
warnings.filterwarnings("ignore", message="X has feature names, but SVC was fitted without feature names")

try:
    # Load user details from Excel file into a DataFrame
    user_details_df = pd.read_excel(excelLocation+"/churn_list.xlsx")

    # Preprocess user details
    user_details_df['Gender'] = user_details_df['Gender'].map({'male': 0, 'female': 1})

    # Drop 'UserId' column
    user_details_df_user_id_drop = user_details_df.drop(['UserId'], axis=1)

    # Load the scaler
    scaler = MinMaxScaler()

    # Scale the user details
    user_details_scaled = user_details_df_user_id_drop.copy()
    user_details_scaled[['Age', 'ProductClicks', 'APIsCalled', 'AvgRatingOnAllProduct', 'AvgOrderValues', 'TotalMoneySpent']] = scaler.fit_transform(user_details_scaled[['Age', 'ProductClicks', 'APIsCalled', 'AvgRatingOnAllProduct', 'AvgOrderValues', 'TotalMoneySpent']])

    # Separate 'Gender' column
    gender_column = user_details_scaled[['Gender']]
    numerical_data = user_details_scaled.drop('Gender', axis=1)

    # Impute numerical columns
    imputer = SimpleImputer(strategy='mean')
    numerical_data_imputed = imputer.fit_transform(numerical_data)
    user_details_imputed = pd.DataFrame(numerical_data_imputed, columns=numerical_data.columns)

    # Concatenate 'Gender' column back
    user_details_imputed = pd.concat([user_details_imputed, gender_column], axis=1)

    # Fill missing values in all columns (including 'Gender') with mean of respective columns
    user_details_imputed.fillna(user_details_imputed.mean(), inplace=True)

    with open(dirpath+'/churning/logistic_regression_model.pkl', 'rb') as f:
        logistic_coefficients = pickle.load(f)

    with open(dirpath+'/churning/random_forest_models.pkl', 'rb') as f:
        classifiers = pickle.load(f)

    with open(dirpath+'/churning/svm_model.pkl', 'rb') as f:
        svm_classifier = pickle.load(f)

    # Define the sigmoid function
    def sigmoid(z):
        return 1 / (1 + np.exp(-z))

    def logistic_regression_predict(X, coefficients):
        X_with_intercept = np.insert(X, 0, 1, axis=1)
        y_pred = sigmoid(np.dot(X_with_intercept, coefficients))
        return np.round(y_pred)

    def random_forest_predict(X, classifiers):
        predictions = []
        for clf in classifiers:
            prediction = clf.predict(X)
            predictions.append(prediction)
        combined_prediction = np.round(np.mean(predictions, axis=0))
        return combined_prediction

    def svm_predict(X, clf):
        return clf.predict(X)

    # Make predictions
    logistic_prediction = logistic_regression_predict(user_details_imputed, logistic_coefficients)
    random_forest_prediction = random_forest_predict(user_details_imputed, classifiers)
    svm_prediction = svm_predict(user_details_imputed, svm_classifier)

    # Combine predictions using voting ensemble
    final_prediction = np.round((logistic_prediction + random_forest_prediction + svm_prediction) / 3)

    churned_user_ids = []

    for i, prediction in enumerate(final_prediction):
        if prediction == 1:
            user_id = user_details_df.iloc[i]['UserId']
            user_id = user_id.strip('"') 
            churned_user_ids.append(user_id)

    churned_user_ids_array = np.array(churned_user_ids)
    print(churned_user_ids_array)

except Exception as e:
    print(f"Error occurred: {str(e)}", file=sys.stderr)
