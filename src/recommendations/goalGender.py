import sys
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
import numpy as np
import warnings

# Ignore the warning
warnings.filterwarnings("ignore", message="X does not have valid feature names")

from constants import excelLocation

# Load the data
data2 = pd.read_excel(excelLocation+"/user_details.xlsx")
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

# Function to recommend products based on goal and gender
def recommend_products_by_goal_gender(goal, gender):
    encoded_data2 = {}
    for column in ['Goal', 'Gender']:
        le = label_encoders2[column]
        encoded_data2[column] = le.transform([goal, gender])[0] if goal in le.classes_ and gender in le.classes_ else -1
    scaled_data2 = scaler2.transform(np.array([[encoded_data2['Goal'], encoded_data2['Gender']]]))
    predicted_cluster2 = kmeans2.predict(scaled_data2)[0]
    cluster_products2 = data2.groupby('kmclus2')['Product'].value_counts().reset_index(name='count')
    most_frequent_products2 = cluster_products2.groupby('kmclus2').first()
    try:
        recommended_product2 = most_frequent_products2.loc[predicted_cluster2]['Product']
    except KeyError:
        recommended_product2 = "No product found for this cluster"
    return recommended_product2

if len(sys.argv) == 3:
    goal = sys.argv[1]
    gender = sys.argv[2]
    recommended_product = recommend_products_by_goal_gender(goal, gender)
    print(recommended_product)
