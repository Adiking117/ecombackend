import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np
import warnings
import json
import pickle
import sys

warnings.filterwarnings("ignore", message="X does not have valid feature names")

def load_data():
    data = pd.read_excel("C:/Users/Aditya/Desktop/Ecomm CLG/backend/public/temp/user_details.xlsx")
    
    imputer = SimpleImputer(strategy='mean')
    data[['Age', 'Height', 'Weight']] = imputer.fit_transform(data[['Age', 'Height', 'Weight']])
    scaler = StandardScaler()
    data[['age_scaled', 'height_scaled', 'weight_scaled']] = scaler.fit_transform(data[['Age', 'Height', 'Weight']])
    
    return data, scaler

def dump_pickle(data):
    with open('user_data.pickle', 'wb') as handle:
        pickle.dump(data, handle, protocol=pickle.HIGHEST_PROTOCOL)

def load_pickle():
    with open('user_data.pickle', 'rb') as handle:
        data = pickle.load(handle)
    return data

def recommend_products(age, height, weight, data, scaler):
    scaled_data = scaler.transform(np.array([[age, height, weight]]))
    
    dbscan = DBSCAN(eps=0.3, min_samples=10)  # You can adjust epsilon and min_samples as needed
    data['dbscan_cluster'] = dbscan.fit_predict(data[['age_scaled', 'height_scaled', 'weight_scaled']])
    
    input_cluster = dbscan.labels_[-1]  
    
    cluster_products = data[data['dbscan_cluster'] == input_cluster]['Product']
    
    top5_frequent_products = cluster_products.value_counts().head(5).index.tolist()
    
    return top5_frequent_products

if __name__ == "__main__":
    data, scaler = load_data()
    dump_pickle(data)

    if len(sys.argv) == 4:
        age = float(sys.argv[1])
        height = float(sys.argv[2])
        weight = float(sys.argv[3])
        top5_products = recommend_products(age, height, weight, data, scaler)
        print(json.dumps(top5_products)) 



