from flask import Flask, render_template, request, jsonify
from typing import Any
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from textblob import TextBlob
import nltk

nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')

app = Flask(__name__)

data1 = pd.read_csv("C:/Users/Aditya/Downloads/final_customersegmentation1.csv")
# AGE, HEIGHT, WEIGHT
imputer = SimpleImputer(strategy='mean')
data1[['age', 'height', 'weight']] = imputer.fit_transform(data1[['age', 'height', 'weight']])
scaler1 = StandardScaler()
data1[['age_scaled', 'height_scaled', 'weight_scaled']] = scaler1.fit_transform(data1[['age', 'height', 'weight']])
kmeans1 = KMeans(n_clusters=6, init='random', n_init=10)
data1['kmclus1'] = kmeans1.fit_predict(data1[['age_scaled', 'height_scaled', 'weight_scaled']])


data2 = pd.read_csv("C:/Users/Aditya/Downloads/final_customersegmentation1.csv")
# GOAL, GENDER
label_encoders2 = {}
for column in ['goal', 'gender']:
    le = LabelEncoder()
    data2[column] = le.fit_transform(data2[column])
    label_encoders2[column] = le
scaler2 = StandardScaler()
data2_scaled = scaler2.fit_transform(data2[['goal', 'gender']])
kmeans2 = KMeans(n_clusters=6, init='random', n_init=10)
data2['kmclus2'] = kmeans2.fit_predict(data2_scaled)


data3 = pd.read_csv("C:/Users/Aditya/Downloads/final_customersegmentation1.csv")
# COUNTRY, LANGUAGE
label_encoders3 = {}
for column in ['country', 'language']:
    le = LabelEncoder()
    data3[column] = le.fit_transform(data3[column])
    label_encoders3[column] = le
scaler3 = StandardScaler()
data3_scaled = scaler3.fit_transform(data3[['country', 'language']])
kmeans3 = KMeans(n_clusters=6, init='random', n_init=10)
data3['kmclus3'] = kmeans3.fit_predict(data3_scaled)

@app.route("/", methods=["GET", "POST"])
def recommend_product():
    recommended_product1 = None
    recommended_product2 = None
    recommended_product3 = None
    recommended_products_from_apriori1 = []
    recommended_products_from_apriori2 = [] 
    recommended_products_from_apriori3 = [] 
    feedback = None
    sentiment = None

    if request.method == "POST":
        response_data = {}  
        if "age" in request.form and "height" in request.form and "weight" in request.form:
            age = float(request.form["age"])
            height = float(request.form["height"])
            weight = float(request.form["weight"])
            scaled_data1 = scaler1.transform([[age, height, weight]]) # type: ignore
            predicted_cluster1 = kmeans1.predict(scaled_data1)[0]
            cluster_products1 = data1.groupby('kmclus1')['products'].value_counts().reset_index(name='count')
            most_frequent_products1 = cluster_products1.groupby('kmclus1').first()
            recommended_product1 = most_frequent_products1.loc[predicted_cluster1]['products']
            recommended_products_from_apriori1 = apply_apriori_algorithm(recommended_product1, data1)

        if "goal" in request.form and "gender" in request.form:
            goal = request.form["goal"]
            gender = request.form["gender"]
            encoded_data2 = {}
            for column in ['goal', 'gender']:
                le = label_encoders2[column]
                encoded_data2[column] = le.transform([request.form[column]])[0] if request.form[column] in le.classes_ else -1
            scaled_data2 = scaler2.transform([[encoded_data2['goal'], encoded_data2['gender']]]) # type: ignore
            predicted_cluster2 = kmeans2.predict(scaled_data2)[0]
            cluster_products2 = data2.groupby('kmclus2')['products'].value_counts().reset_index(name='count')
            most_frequent_products2 = cluster_products2.groupby('kmclus2').first()
            try:
                recommended_product2 = most_frequent_products2.loc[predicted_cluster2]['products']
            except KeyError:
                recommended_product2 = "No product found for this cluster"
            recommended_products_from_apriori2 = apply_apriori_algorithm(recommended_product2, data2)

        if "country" in request.form and "language" in request.form:
            country = request.form["country"]
            language = request.form["language"]
            encoded_data3 = {}
            for column in ['country', 'language']:
                le = label_encoders3[column]
                encoded_data3[column] = le.transform([request.form[column]])[0] if request.form[column] in le.classes_ else -1
            scaled_data3 = scaler3.transform([[encoded_data3['country'], encoded_data3['language']]]) # type: ignore
            predicted_cluster3 = kmeans3.predict(scaled_data3)[0]
            cluster_products3 = data3.groupby('kmclus3')['products'].value_counts().reset_index(name='count')
            most_frequent_products3 = cluster_products3.groupby('kmclus3').first()
            recommended_product3 = most_frequent_products3.loc[predicted_cluster3]['products']
            recommended_products_from_apriori3 = apply_apriori_algorithm(recommended_product3, data3)

        # if "feedback" in request.form:
        #     feedback = request.form["feedback"]
        #     feedback = re.sub(r'[^\w\s]', '', feedback)
        #     words = word_tokenize(feedback)
        #     words = [word.lower() for word in words]
        #     stop_words = set(stopwords.words('english'))
        #     filtered_words = [word for word in words if word not in stop_words]
        #     lemmatizer = WordNetLemmatizer()
        #     lemmatized_words = [lemmatizer.lemmatize(word) for word in filtered_words]
        #     lemmatized_words = ' '.join(lemmatized_words)
        #     blob = TextBlob(lemmatized_words)
        #     #sentiment_polarity = blob.sentiment.polarity

        #     if sentiment_polarity > 0:
        #         sentiment = "Thanks For Liking Our Product"
        #     elif sentiment_polarity < 0:
        #         sentiment = "Sorry for your Inconveinience , we'll make sure we will improve our Product Quality"
        #     else:
        #         sentiment = "Thanks for the feedback"

        # Return the recommendations as JSON
        # response_data = {
        #     "recommended_product1": recommended_product1,
        #     "recommended_products_from_apriori1": recommended_products_from_apriori1,
        #     "recommended_product2": recommended_product2,
        #     "recommended_products_from_apriori2": recommended_products_from_apriori2,
        #     "recommended_product3": recommended_product3,
        #     "recommended_products_from_apriori3": recommended_products_from_apriori3,
        #     "sentiment": sentiment,
        #     "feedback": feedback
        # }
        # return jsonify(response_data)

    return render_template("cust.html", recommended_product1=recommended_product1,
                           recommended_products_from_apriori1=recommended_products_from_apriori1,
                           recommended_product2=recommended_product2,
                           recommended_products_from_apriori2=recommended_products_from_apriori2,
                           recommended_product3=recommended_product3,
                           recommended_products_from_apriori3=recommended_products_from_apriori3,
                           sentiment=sentiment,  
                           feedback=feedback)  

def apply_apriori_algorithm(product_name, data):
    products_data = [
    ['WholeGrainBread', 'PeanutButter', 'Oats'],
    ['Oats', 'MuscleMassGainer', 'EnergyBar'],
    ['BCAA', 'Creatine'],
    ['ProteinShake', 'ProteinPowder'],
    ['Oats', 'PeanutButter']
    ]


    # Create a one-hot encoded DataFrame
    oht = pd.get_dummies(pd.DataFrame(products_data), prefix='', prefix_sep='')

    # Find frequent item sets using Apriori
    frequent_item_sets = apriori(oht, min_support=0.2, use_colnames=True)

    # Find association rules
    rules = association_rules(frequent_item_sets, metric="lift", min_threshold=1.0)

    # Filter for rules involving the specified product
    filtered_rules = rules[rules['antecedents'].apply(lambda x: product_name in x) | rules['consequents'].apply(lambda x: product_name in x)]

    # Display the products that should be bought with the specified product
    if not filtered_rules.empty:
        # Extract the antecedents and consequents
        antecedents = filtered_rules['antecedents'].apply(lambda x: list(x)[0])
        consequents = filtered_rules['consequents'].apply(lambda x: list(x)[0])

        # Combine antecedents and consequents
        recommended_products = pd.concat([antecedents, consequents]).reset_index(drop=True).unique()

        return recommended_products
    else:
        return ["No associated products found for this item"]


if __name__ == "__main__":
    app.run(debug=True)

