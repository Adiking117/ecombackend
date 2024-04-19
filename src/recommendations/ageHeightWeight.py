import sys
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np
import warnings
import json


# Ignore the warning
warnings.filterwarnings("ignore", message="X does not have valid feature names")

from constants import excelLocation

# Load the data
data1 = pd.read_excel(excelLocation+"/user_details.xlsx")
# Preprocess the data
imputer = SimpleImputer(strategy='mean')
data1[['Age', 'Height', 'Weight']] = imputer.fit_transform(data1[['Age', 'Height', 'Weight']])
scaler1 = StandardScaler()
data1[['age_scaled', 'height_scaled', 'weight_scaled']] = scaler1.fit_transform(data1[['Age', 'Height', 'Weight']])
kmeans1 = KMeans(n_clusters=3, init='random', n_init=10)
data1['kmclus1'] = kmeans1.fit_predict(data1[['age_scaled', 'height_scaled', 'weight_scaled']])

def recommend_products(age, height, weight):
    scaled_data1 = scaler1.transform(np.array([[age, height, weight]]))
    predicted_cluster1 = kmeans1.predict(scaled_data1)[0]
    cluster_products1 = data1[data1['kmclus1'] == predicted_cluster1]['Product']
    top5_frequent_products = cluster_products1.value_counts().head(5).index.tolist()
    return top5_frequent_products

if len(sys.argv) == 4:
    age = float(sys.argv[1])
    height = float(sys.argv[2])
    weight = float(sys.argv[3])
    top5_products = recommend_products(age, height, weight)
    print(json.dumps(top5_products))  # Output as JSON string
