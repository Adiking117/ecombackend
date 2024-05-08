import sys
import json
class Node:
    def __init__(self, item, frequency, parent):
        self.item = item
        self.frequency = frequency
        self.parent = parent
        self.children = {}


def build_tree(transactions, min_support):
    header_table = {}
    for transaction in transactions:
        for item in transaction:
            header_table[item] = header_table.get(item, 0) + 1

    header_table = {k: v for k, v in header_table.items() if v >= min_support}

    frequent_items = set(header_table.keys())

    if len(frequent_items) == 0:
        return None, None

    for k in header_table:
        header_table[k] = [header_table[k], None]

    root = Node("Null", 1, None)

    for transaction in transactions:
        frequent_transaction = {}
        for item in transaction:
            if item in frequent_items:
                frequent_transaction[item] = header_table[item][0]

        if len(frequent_transaction) > 0:
            ordered_items = [item[0] for item in sorted(frequent_transaction.items(),
                                                         key=lambda x: x[1], reverse=True)]
            update_tree(ordered_items, root, header_table, 1)

    return root, header_table


def update_tree(items, node, header_table, frequency):
    if items[0] in node.children:
        node.children[items[0]].frequency += frequency
    else:
        node.children[items[0]] = Node(items[0], frequency, node)

        if header_table[items[0]][1] is None:
            header_table[items[0]][1] = node.children[items[0]]
        else:
            current = header_table[items[0]][1]
            while current.parent:
                current = current.parent
            current.next = node.children[items[0]]

    if len(items) > 1:
        update_tree(items[1:], node.children[items[0]], header_table, frequency)


def find_prefix_path(base_path, node):
    conditional_patterns = {}
    for child in node.children.values():
        prefix_path = []
        current = child
        while current.parent:
            prefix_path.append(current.item)
            current = current.parent
        if len(prefix_path) > 1:
            conditional_patterns[frozenset(prefix_path[1:])] = child.frequency

    return conditional_patterns


def mine_tree(header_table, min_support, prefix, frequent_item_sets):
    sorted_items = [item[0] for item in sorted(header_table.items(), key=lambda x: x[1][0])]

    for item in sorted_items:
        new_frequent_set = prefix.copy()
        new_frequent_set.add(item)
        frequent_item_sets.append(new_frequent_set)

        conditional_pattern_bases = find_prefix_path(item, header_table[item][1])
        conditional_tree, conditional_header = build_tree(conditional_pattern_bases.keys(), min_support)

        if conditional_header is not None:
            mine_tree(conditional_header, min_support, new_frequent_set, frequent_item_sets)


def fp_growth(transactions, min_support):
    root, header_table = build_tree(transactions, min_support)
    frequent_item_sets = []
    mine_tree(header_table, min_support, set(), frequent_item_sets)
    return frequent_item_sets


def find_frequent_item_sets_for_product(transactions, product_name, min_support):
    product_transactions = [transaction for transaction in transactions if product_name in transaction]
    frequent_item_sets = fp_growth(product_transactions, min_support)
    return frequent_item_sets




input_product = sys.argv[1]
transactions = transactions = [
['Peanut Butter Protein Powder', 'Protein Shake Ready-to-Drink (RTD)', 'Pre-Workout Supplement'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Whey Protein Powder', 'Peanut Butter Protein Powder'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Whey Protein Powder', 'Protein Shake Ready-to-Drink (RTD)'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Whey Protein Powder', 'Pre-Workout Supplement'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Peanut Butter Protein Powder', 'Protein Shake Ready-to-Drink (RTD)'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Peanut Butter Protein Powder', 'Pre-Workout Supplement'],
['Creatine Monohydrate', 'Mass Gainer Supplement', 'Protein Shake Ready-to-Drink (RTD)', 'Pre-Workout Supplement'],
['Creatine Monohydrate', 'Whey Protein Powder', 'Peanut Butter Protein Powder', 'Protein Shake Ready-to-Drink (RTD)'],
['Creatine Monohydrate', 'Whey Protein Powder', 'Peanut Butter Protein Powder', 'Pre-Workout Supplement'],
['Creatine Monohydrate', 'Whey Protein Powder', 'Protein Shake Ready-to-Drink (RTD)', 'Pre-Workout Supplement']
]

# transactions_json = sys.argv[2] 
# transactions = json.loads(transactions_json)
min_support = 3  
frequent_item_sets = find_frequent_item_sets_for_product(transactions, input_product, min_support)
all_frequent_products = [product for item_set in frequent_item_sets for product in item_set]
print(json.dumps(all_frequent_products))