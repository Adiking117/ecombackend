import pandas as pd
from constants import excelLocation

def get_top_5_products():
    data = pd.read_excel(excelLocation + "/user_details.xlsx")
    top5_products = data['Product'].value_counts().index[:5]
    top5_products_str = ','.join(top5_products)
    return top5_products_str

top5products = get_top_5_products()
print(top5products)
