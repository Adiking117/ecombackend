import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np
import warnings
import json
import pickle
from sklearn.neighbors import NearestNeighbors
import sys
import os

# Importing constants from the parent directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath, excelLocation

warnings.filterwarnings("ignore", message="X does not have valid feature names")

def load_data():
    try:
        data = pd.read_excel(excelLocation+"/user_details.xlsx")
        
        imputer = SimpleImputer(strategy='mean')
        data[['Age', 'Height', 'Weight']] = imputer.fit_transform(data[['Age', 'Height', 'Weight']])
        scaler = StandardScaler()
        data[['age_scaled', 'height_scaled', 'weight_scaled']] = scaler.fit_transform(data[['Age', 'Height', 'Weight']])
        
        return data, scaler
    except Exception as e:
        print(f"Error occurred while loading data: {str(e)}", file=sys.stderr)
        return None, None


def recommend_products(age, height, weight, data, scaler, k_neighbors=5):
    try:
        scaled_data = scaler.transform(np.array([[age, height, weight]]))
        
        dbscan = DBSCAN(eps=0.3, min_samples=10)
        data['dbscan_cluster'] = dbscan.fit_predict(data[['age_scaled', 'height_scaled', 'weight_scaled']])
        
        input_cluster = dbscan.labels_[-1]  
        
        cluster_data = data[data['dbscan_cluster'] == input_cluster]
        cluster_features = cluster_data[['age_scaled', 'height_scaled', 'weight_scaled']]
        
        knn = NearestNeighbors(n_neighbors=k_neighbors)
        knn.fit(cluster_features)
        distances, indices = knn.kneighbors(scaled_data)
        
        neighbor_indices = indices[0][1:]
        
        neighbor_products = cluster_data.iloc[neighbor_indices]['Product'].tolist()
        product_frequency = cluster_data['Product'].value_counts()
        top_product = product_frequency.index[0] 
        
        return neighbor_products, top_product
    except Exception as e:
        print(f"Error occurred while recommending products: {str(e)}", file=sys.stderr)
        return None, None

if __name__ == "__main__":
    data, scaler = load_data()

    if data is not None and scaler is not None:
        if len(sys.argv) == 4:
            try:
                age = float(sys.argv[1])
                height = float(sys.argv[2])
                weight = float(sys.argv[3])
                neighbor_products, top_product = recommend_products(age, height, weight, data, scaler, k_neighbors=5)
                if neighbor_products is not None and top_product is not None:
                    combined_products_set = set([top_product] + neighbor_products)
                    combined_products = list(combined_products_set)
                    print(json.dumps(combined_products))
            except Exception as e:
                print(f"Error occurred while processing input arguments: {str(e)}", file=sys.stderr)
