import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np
import warnings
import json
import pickle
import sys
from constants import excelLocation

# Ignore the warning
warnings.filterwarnings("ignore", message="X does not have valid feature names")

def load_data():
    
    data = pd.read_excel(excelLocation + "/user_details.xlsx")
    
    # Preprocess the data
    imputer = SimpleImputer(strategy='mean')
    data[['Age', 'Height', 'Weight']] = imputer.fit_transform(data[['Age', 'Height', 'Weight']])
    scaler = StandardScaler()
    data[['age_scaled', 'height_scaled', 'weight_scaled']] = scaler.fit_transform(data[['Age', 'Height', 'Weight']])
    
    # Perform KMeans clustering
    kmeans = KMeans(n_clusters=3, init='random', n_init=10)
    data['kmclus1'] = kmeans.fit_predict(data[['age_scaled', 'height_scaled', 'weight_scaled']])
    
    return data, scaler

# Dump the data into a pickle file
def dump_pickle(data):
    with open('user_data.pickle', 'wb') as handle:
        pickle.dump(data, handle, protocol=pickle.HIGHEST_PROTOCOL)

# Load data from pickle file
def load_pickle():
    with open('user_data.pickle', 'rb') as handle:
        data = pickle.load(handle)
    return data

# Recommendation function
def recommend_products(age, height, weight, data, scaler):
    scaled_data = scaler.transform(np.array([[age, height, weight]]))
    kmeans = KMeans(n_clusters=3, init='random', n_init=10)
    kmeans.fit(data[['age_scaled', 'height_scaled', 'weight_scaled']])
    predicted_cluster = kmeans.predict(scaled_data)[0]
    cluster_products = data[data['kmclus1'] == predicted_cluster]['Product']
    top5_frequent_products = cluster_products.value_counts().head(5).index.tolist()
    return top5_frequent_products

if __name__ == "__main__":
    # Load or dump data
    data, scaler = load_data()
    dump_pickle(data)

    # Command-line arguments
    if len(sys.argv) == 4:
        age = float(sys.argv[1])
        height = float(sys.argv[2])
        weight = float(sys.argv[3])
        top5_products = recommend_products(age, height, weight, data, scaler)
        print(json.dumps(top5_products))  # Output as JSON string
