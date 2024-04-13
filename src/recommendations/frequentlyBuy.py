import sys
import pandas as pd
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules
import warnings

# Suppress DeprecationWarning
warnings.filterwarnings("ignore", category=DeprecationWarning)


def apply_apriori_algorithm(product_name):
    products_data = [
    ['Whole Grain Bread', 'Peanut Butter', 'Oats'],
    ['Oats', 'Muscle Mass Gainer', 'Energy Bar'],
    ['BCAA', 'Creatine'],
    ['Protein Shake', 'Protein Powder'],
    ['Oats', 'Peanut Butter']
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

if len(sys.argv) == 2:
    product_name = sys.argv[1]
    recommended_products = apply_apriori_algorithm(product_name)
    print(recommended_products)
