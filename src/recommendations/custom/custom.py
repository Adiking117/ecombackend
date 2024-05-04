import pandas as pd
import pickle
import os
import sys
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath

try:
    with open(dirpath+'/custom/random_forest_model.pkl', 'rb') as file:
        loaded_model, columns = pickle.load(file)

    def preprocess_new_user_data(raw_data, columns):
        new_user_df = pd.DataFrame([raw_data])

        new_user_df = pd.get_dummies(new_user_df, columns=["BMI", "Gender", "Blood_Pressure", "Diabetes", "Cholesterol_Level"])

        for col in columns:
            if col not in new_user_df.columns:
                new_user_df[col] = False 

        new_user_df = new_user_df[columns]

        return new_user_df

    # new_user_raw_data = {
    #     "BMI": "Normal",
    #     "Gender": "Female",
    #     "Blood Pressure": "Normal",
    #     "Diabetes": "Low",
    #     "Cholesterol Level": "Normal"
    # }

    #new_user_raw_data = sys.argv[1]
    new_user_raw_data = json.loads(sys.argv[1])
    preprocessed_new_user_data = preprocess_new_user_data(new_user_raw_data, columns)

    predicted_goal = loaded_model.predict(preprocessed_new_user_data)

    print(predicted_goal[0])

except Exception as e:
    print(f"Error occurred: {str(e)}", file=sys.stderr)
