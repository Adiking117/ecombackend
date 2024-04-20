import sys
import pandas as pd
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules
from constants import excelLocation

def load_and_mine_data(csv_path, product_name, min_support_threshold=0.03, min_lift=3, min_confidence=0.3):
    # Load data
    myretaildata = pd.read_csv(csv_path)

    # Preprocess data
    myretaildata['Products'] = myretaildata['Products'].str.strip()
    myretaildata.dropna(axis=0, subset=['Invoice No'], inplace=True)
    myretaildata['Invoice No'] = myretaildata['Invoice No'].astype('str')

    # Create basket sets
    mybasket = (myretaildata.groupby(['Invoice No','Products'])['Quantity']
        .sum().unstack().reset_index().fillna(0)
        .set_index('Invoice No'))
    
    # Convert to boolean type
    my_basket_sets = mybasket.map(lambda x: True if x >= 1 else False)

    # Generate frequent itemsets
    my_frequent_itemsets = apriori(my_basket_sets, min_support=min_support_threshold, use_colnames=True)

    # Generate association rules
    my_rules = association_rules(my_frequent_itemsets, metric="lift", min_threshold=min_lift)

    def get_recommendations(antecedents):
        # Filter rules based on the antecedents
        filtered_rules = my_rules[my_rules['antecedents'] == frozenset({antecedents})]

        # Sort rules based on the number of consequents in descending order
        sorted_rules = filtered_rules.sort_values(by=['consequents'], key=lambda x: x.str.len(), ascending=False)

        # Return the first row with the most consequents as a list
        if not sorted_rules.empty:
            consequents_list = list(sorted_rules.iloc[0]['consequents'])
            return consequents_list
        else:
            return None

    return get_recommendations(product_name)

# Define the path to your CSV file
csv_path = excelLocation+"/ListOfProducts.csv"

# Get the product name from command-line argument
product_name = sys.argv[1]

# product_name = 'Protein Water'

# Call the load_and_mine_data function to get the get_recommendations function
recommendations = load_and_mine_data(csv_path, product_name)
print(recommendations)
