import sys
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
import numpy as np
import warnings
import json
from sklearn.neighbors import NearestNeighbors

# Ignore the warning
warnings.filterwarnings("ignore", message="X does not have valid feature names")


import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
from constants import dirpath,excelLocation

# Load the data
data2 = pd.read_excel(excelLocation + "/user_details.xlsx")
# GOAL, GENDER
label_encoders2 = {}
for column in ['Goal', 'Gender']:
    le = LabelEncoder()
    data2[column] = le.fit_transform(data2[column])
    label_encoders2[column] = le
scaler2 = StandardScaler()
data2_scaled = scaler2.fit_transform(data2[['Goal', 'Gender']])
kmeans2 = KMeans(n_clusters=3, init='random', n_init=10)
data2['kmclus2'] = kmeans2.fit_predict(data2_scaled)


def recommend_products_by_goal_gender(goal, gender):
    encoded_data2 = {}
    for column in ['Goal', 'Gender']:
        le = label_encoders2[column]
        encoded_data2[column] = le.transform([goal, gender])[0] if goal in le.classes_ and gender in le.classes_ else -1
    scaled_data2 = scaler2.transform(np.array([[encoded_data2['Goal'], encoded_data2['Gender']]]))
    predicted_cluster2 = kmeans2.predict(scaled_data2)[0]
    cluster_products2 = data2[data2['kmclus2'] == predicted_cluster2]['Product']
    top_frequent_product = cluster_products2.value_counts().index.tolist()[0]
    return top_frequent_product

def find_nearest_neighbors(product, k=5):
    product_index = data2[data2['Product'] == product].index.values[0]
    knn = NearestNeighbors(n_neighbors=k)
    knn.fit(data2_scaled)
    distances, indices = knn.kneighbors(data2_scaled[product_index].reshape(1, -1))
    neighbor_indices = indices[0][1:]
    neighbor_products = data2.iloc[neighbor_indices]['Product'].tolist()
    return neighbor_products

if len(sys.argv) == 3:
    goal = sys.argv[1]
    gender = sys.argv[2]
    top_product = recommend_products_by_goal_gender(goal, gender)
    neighbor_products = find_nearest_neighbors(top_product)

    combined_products_set = set([top_product] + neighbor_products)

    combined_products = list(combined_products_set)

    print(json.dumps(combined_products))