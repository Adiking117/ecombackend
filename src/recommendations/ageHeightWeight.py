import sys
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np
import warnings

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

# Function to recommend products based on age, height, and weight
def recommend_products(age, height, weight):
    scaled_data1 = scaler1.transform(np.array([[age, height, weight]]))
    predicted_cluster1 = kmeans1.predict(scaled_data1)[0]
    cluster_products1 = data1.groupby('kmclus1')['Product'].value_counts().reset_index(name='count')
    most_frequent_products1 = cluster_products1.groupby('kmclus1').first()
    recommended_product1 = most_frequent_products1.loc[predicted_cluster1]['Product']
    return recommended_product1

if len(sys.argv) == 4:
    age = float(sys.argv[1])
    height = float(sys.argv[2])
    weight = float(sys.argv[3])
    recommended_product = recommend_products(age, height, weight)
    print(recommended_product)
