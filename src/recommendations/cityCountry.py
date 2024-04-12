import sys
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import LabelEncoder
import numpy as np
import warnings

# Ignore the warning
warnings.filterwarnings("ignore", message="X does not have valid feature names")
from constants import excelLocation

# Load the data
data = pd.read_excel(excelLocation+"/user_details.xlsx")

# Preprocess the data
label_encoders = {}
for column in ['Country', 'City']:
    le = LabelEncoder()
    data[column] = le.fit_transform(data[column])
    label_encoders[column] = le

scaler = StandardScaler()
data_scaled = scaler.fit_transform(data[['Country', 'City']])

kmeans = KMeans(n_clusters=3, init='random', n_init=10)
data['kmclus'] = kmeans.fit_predict(data_scaled)

# Function to recommend products based on city and country
def recommend_products(city, country):
    encoded_data = {}
    for column in ['Country', 'City']:
        le = label_encoders[column]
        encoded_data[column] = le.transform([country, city])[0] if country in le.classes_ and city in le.classes_ else -1
    scaled_data = scaler.transform(np.array([[encoded_data['Country'], encoded_data['City']]])) # Use np.array here
    predicted_cluster = kmeans.predict(scaled_data)[0]
    cluster_products = data.groupby('kmclus')['Product'].value_counts().reset_index(name='count')
    most_frequent_products = cluster_products.groupby('kmclus').first()
    recommended_product = most_frequent_products.loc[predicted_cluster]['Product']
    return recommended_product

if len(sys.argv) == 3:
    city = sys.argv[1]
    country = sys.argv[2]
    recommended_product = recommend_products(city, country)
    print(recommended_product)
