import pickle
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import MinMaxScaler
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath, excelLocation

try:
    with open(dirpath+'/abandon/cart_abandon.pkl', 'rb') as f:
        loaded_model = pickle.load(f)

    user_details_df = pd.read_excel(excelLocation+"/abandon.xlsx")

    user_details_df_user_id_drop = user_details_df.drop(['ID'], axis=1)

    scaler = MinMaxScaler()

    user_details_scaled = user_details_df_user_id_drop.copy()
    user_details_scaled[['No_Items_Added_InCart', 'No_Items_Removed_FromCart', 'No_Cart_Viewed', 'No_Checkout_Confirmed', 'No_Checkout_Initiated ', 'No_Customer_Login','No_Page_Viewed']] = scaler.fit_transform(user_details_scaled[['No_Items_Added_InCart', 'No_Items_Removed_FromCart', 'No_Cart_Viewed', 'No_Checkout_Confirmed', 'No_Checkout_Initiated ', 'No_Customer_Login','No_Page_Viewed']])

    new_user_dmatrix = xgb.DMatrix(user_details_scaled)
    predicted_class_proba = loaded_model.predict(new_user_dmatrix)
    ids_prob_less_than_05 = []

    for idx, prob in zip(user_details_df['ID'], predicted_class_proba):
        if prob > 0.5:
            ids_prob_less_than_05.append(idx.strip('"')) 

    print(ids_prob_less_than_05)

except Exception as e:
    print(f"Error occurred: {str(e)}", file=sys.stderr)
