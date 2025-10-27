#!/usr/bin/env python3
"""
Convert products.json to products.csv
"""

import json
import csv
import sys

def json_to_csv(json_path, csv_path):
    """Convert JSON file to CSV format"""
    try:
        # Read JSON file
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Get field names from first item
        if not data:
            print("Error: JSON file is empty")
            return False
        
        fieldnames = ['id', 'title', 'description', 'price', 'category', 'image']
        
        # Write CSV file
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for item in data:
                writer.writerow(item)
        
        print(f"✅ Successfully converted {json_path} to {csv_path}")
        print(f"📊 Total products: {len(data)}")
        return True
        
    except FileNotFoundError:
        print(f"Error: File not found: {json_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    json_path = 'data/products.json'
    csv_path = 'data/products.csv'
    
    # Allow custom paths
    if len(sys.argv) > 1:
        json_path = sys.argv[1]
    if len(sys.argv) > 2:
        csv_path = sys.argv[2]
    
    json_to_csv(json_path, csv_path)

