import requests
import json
from typing import Dict, List, Any
import sys

class DirectusSchemaExporter:
    def __init__(self, base_url: str, access_token: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    def get_field_info(self, field: Dict[str, Any]) -> Dict[str, Any]:
        """Get field type and possible examples from interface settings."""
        type_name = field.get('type')
        field_name = field.get('field')
        meta = field.get('full_field', {}).get('meta', {})
        
        # Map Directus types to simplified types
        type_mapping = {
            'string': 'string',
            'text': 'string',
            'integer': 'integer',
            'bigInteger': 'integer',
            'float': 'float',
            'decimal': 'float',
            'boolean': 'boolean',
            'uuid': 'string',
            'timestamp': 'datetime',
            'alias': 'relation'
        }
        
        field_type = type_mapping.get(type_name, 'string')
        examples = []

        # Handle different types of fields
        if field_name == 'make':
            examples = ['BMW', 'Toyota', 'Volkswagen', 'Skoda']
        elif field_name == 'engine_type':
            examples = ['electric', 'diesel', 'gasoline', 'hybrid']
        elif field_name == 'body_type':
            examples = ['sedan', 'hatchback', 'suv', 'coupe', 'convertible', 
                      'station_wagon', 'pickup', 'minivan', 'limousine', 'van']
        elif field_name == 'year':
            examples = ["Range: 1900 to unlimited"]
        elif field_name == 'mileage' or field_name == 'price':
            examples = ["Range: 0 to unlimited"]
        elif field_type == 'boolean':
            examples = [True, False]
        elif meta.get('interface') == 'datetime':
            examples = ["YYYY-MM-DD HH:mm:ss"]
        elif meta.get('interface') == 'file-image':
            examples = ["Image file"]
        elif meta.get('interface') == 'list-o2m':
            examples = ["One-to-many relation"]
        elif meta.get('interface') == 'select-dropdown-m2o':
            examples = ["Many-to-one relation"]

        # If we have choices in options, use those instead
        options = meta.get('options', {})
        if options and 'choices' in options:
            examples = [choice.get('value') for choice in options['choices'] if 'value' in choice]
            
        return {
            'type': field_type,
            'examples': examples
        }

    def get_collection_schema(self, collection_name: str) -> Dict[str, Any]:
        """Get simplified schema for a collection with interface examples."""
        try:
            # Get fields
            response = requests.get(
                f'{self.base_url}/fields/{collection_name}',
                headers=self.headers
            )
            response.raise_for_status()
            fields_data = response.json()['data']
            
            # Process fields
            fields = {}
            
            for field in fields_data:
                field_name = field['field']
                # Skip primary key and system fields
                if field_name == 'id' or field_name.startswith('directus_'):
                    continue
                    
                fields[field_name] = self.get_field_info(field)
            
            return {
                'fields': fields
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting schema for collection {collection_name}: {str(e)}")
            raise

    def export_schema(self, output_file: str = 'simplified_schema.json'):
        """Export simplified schema for all custom collections."""
        try:
            # Get collections
            response = requests.get(
                f'{self.base_url}/collections',
                headers=self.headers
            )
            response.raise_for_status()
            collections = [
                c['collection'] for c in response.json()['data']
                if not c['collection'].startswith('directus_')
            ]
            
            # Generate schema
            schema = {}
            for collection in collections:
                print(f"Processing collection: {collection}")
                schema[collection] = self.get_collection_schema(collection)
            
            # Export to file
            with open(output_file, 'w') as f:
                json.dump(schema, f, indent=2)
            
            print(f'\nSchema successfully exported to {output_file}')
            return schema
            
        except Exception as e:
            print(f"Error during schema export: {str(e)}")
            sys.exit(1)

def main():
    base_url = 'http://localhost:8055/'  # Your Directus URL
    access_token = 'rGHpVs5mZxda3Siw07v-iz3NhfdFMWmE'    # Your static access token from Directus

    print("\nDirectus Simplified Schema Export Tool")
    print("=====================================")
    print(f"Base URL: {base_url}")
    print(f"Access Token used: {access_token[:5]}..." if len(access_token) > 5 else "Access Token not set")
    print("=====================================\n")

    exporter = DirectusSchemaExporter(base_url, access_token)
    schema = exporter.export_schema()
    
    # Print the schema in a clean format
    print(json.dumps(schema, indent=2))

if __name__ == '__main__':
    main()