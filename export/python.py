import requests
import json
from typing import Dict, List, Any, Optional
import sys
from collections import Counter

class DirectusSchemaExporter:
    def __init__(self, base_url: str, access_token: str, sample_size: int = 5):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        self.sample_size = sample_size  # Number of examples to fetch per field

    def get_field_examples(self, collection_name: str, field_name: str, field_type: str) -> List[Any]:
        """Fetch actual field examples from the database."""
        try:
            # Fetch a limited number of records for this collection
            response = requests.get(
                f'{self.base_url}/items/{collection_name}',
                params={
                    'limit': self.sample_size,
                    'fields': field_name
                },
                headers=self.headers
            )
            response.raise_for_status()
            items = response.json().get('data', [])
            
            # Extract unique values for the field
            values = [item.get(field_name) for item in items if item.get(field_name) is not None]
            
            # For arrays, flatten the values
            if values and isinstance(values[0], list):
                flattened_values = []
                for value_list in values:
                    if isinstance(value_list, list):
                        flattened_values.extend(value_list)
                values = flattened_values
            
            # Remove duplicates while preserving order
            unique_values = []
            seen = set()
            for value in values:
                if not isinstance(value, (list, dict)) and value not in seen:
                    seen.add(value)
                    unique_values.append(value)
            
            # Limit to sample size
            return unique_values[:self.sample_size]
            
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch examples for {collection_name}.{field_name}: {str(e)}")
            return []

    def get_relation_examples(self, collection_name: str, relation_field: Dict[str, Any]) -> List[str]:
        """Get examples for relation fields by fetching the related collection."""
        try:
            meta = relation_field.get('meta', {})
            relation_collection = meta.get('collection')
            
            if not relation_collection:
                return ["Relation (collection unknown)"]
            
            # Try to get the primary display field of the related collection
            fields_response = requests.get(
                f'{self.base_url}/fields/{relation_collection}',
                headers=self.headers
            )
            fields_response.raise_for_status()
            fields_data = fields_response.json().get('data', [])
            
            # Find a suitable field to use as display value
            display_field = None
            for field in fields_data:
                if field.get('meta', {}).get('display'):
                    display_field = field.get('field')
                    break
            
            if not display_field:
                # Fallback to id or first string field
                display_field = 'id'
                for field in fields_data:
                    if field.get('type') in ['string', 'text']:
                        display_field = field.get('field')
                        break
            
            # Fetch examples from related collection
            response = requests.get(
                f'{self.base_url}/items/{relation_collection}',
                params={
                    'limit': self.sample_size,
                    'fields': display_field
                },
                headers=self.headers
            )
            response.raise_for_status()
            items = response.json().get('data', [])
            
            # Extract unique values
            values = [item.get(display_field) for item in items if item.get(display_field) is not None]
            
            # Remove duplicates while preserving order
            unique_values = []
            seen = set()
            for value in values:
                if not isinstance(value, (list, dict)) and value not in seen:
                    seen.add(value)
                    unique_values.append(value)
            
            return unique_values[:self.sample_size]
            
        except requests.exceptions.RequestException as e:
            print(f"Warning: Could not fetch relation examples for {collection_name}.{relation_field.get('field')}: {str(e)}")
            return [f"Relation to {relation_collection}"]

    def get_field_info(self, collection_name: str, field: Dict[str, Any]) -> Dict[str, Any]:
        """Get field type and examples from field options and actual database values."""
        type_name = field.get('type')
        field_name = field.get('field')
        meta = field.get('meta', {})
        
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
            'date': 'date',
            'time': 'time',
            'json': 'object',
            'csv': 'array',
            'alias': 'relation'
        }
        
        field_type = type_mapping.get(type_name, 'string')
        
        # Handle special field types
        if meta.get('interface') == 'file' or meta.get('interface') == 'file-image':
            field_type = 'file'
        elif meta.get('interface') in ['many-to-one', 'select-dropdown-m2o']:
            field_type = 'relation-m2o'
        elif meta.get('interface') in ['one-to-many', 'list-o2m']:
            field_type = 'relation-o2m'
        elif meta.get('interface') in ['many-to-many', 'list-m2m']:
            field_type = 'relation-m2m'
        
        examples = []
        
        # 1. Check if the field has predefined choices in options
        options = meta.get('options', {})
        if options and 'choices' in options:
            examples = [choice.get('value') for choice in options['choices'] if 'value' in choice]
            if examples:
                return {
                    'type': field_type,
                    'examples': examples,
                    'source': 'choices-options'
                }
                
        # 2. Check if dropdown interface with static options
        if meta.get('interface') in ['select-dropdown', 'select', 'radio-buttons', 'checkboxes']:
            if 'choices' in options:
                examples = [choice.get('value') for choice in options['choices'] if 'value' in choice]
                if examples:
                    return {
                        'type': field_type,
                        'examples': examples,
                        'source': 'interface-options'
                    }
                    
        # 3. Check if it has min/max constraints (for numeric fields)
        if field_type in ['integer', 'float']:
            min_value = meta.get('min', None)
            max_value = meta.get('max', None)
            if min_value is not None or max_value is not None:
                range_info = f"Range: {min_value if min_value is not None else 'unlimited'} to {max_value if max_value is not None else 'unlimited'}"
                return {
                    'type': field_type,
                    'examples': [range_info],
                    'source': 'constraints'
                }
                
        # 4. For boolean fields, always use standard values
        if field_type == 'boolean':
            return {
                'type': field_type,
                'examples': [True, False],
                'source': 'standard'
            }
            
        # 5. For relation fields, get examples from related collection
        if field_type.startswith('relation'):
            examples = self.get_relation_examples(collection_name, field)
            if examples:
                return {
                    'type': field_type,
                    'examples': examples,
                    'source': 'relation-data'
                }
                
        # 6. As last resort, get examples from database
        examples = self.get_field_examples(collection_name, field_name, field_type)
        if examples:
            return {
                'type': field_type,
                'examples': examples,
                'source': 'database-values'
            }
        
        # 7. Provide default examples/guidance when nothing else is available
        if field_type == 'datetime':
            examples = ["YYYY-MM-DD HH:mm:ss"]
        elif field_type == 'date':
            examples = ["YYYY-MM-DD"]
        elif field_type == 'time':
            examples = ["HH:mm:ss"]
        elif field_type == 'file':
            examples = ["[File reference]"]
        elif field_type.startswith('relation'):
            examples = [f"Relation to {meta.get('collection', 'unknown')}"]
        else:
            examples = [f"[No examples available for {field_type}]"]
            
        return {
            'type': field_type,
            'examples': examples,
            'source': 'default'
        }
        
        return {
            'type': field_type,
            'examples': examples
        }

    def get_collection_schema(self, collection_name: str) -> Dict[str, Any]:
        """Get simplified schema for a collection with real data examples."""
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
                    
                fields[field_name] = self.get_field_info(collection_name, field)
            
            return {
                'fields': fields
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting schema for collection {collection_name}: {str(e)}")
            raise

    def export_schema(self, output_file: str = 'schema_with_examples.json'):
        """Export schema with real data examples for all custom collections."""
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
    access_token = 'rGHpVs5mZxda3Siw07v-iz3NhfdFMWmE'  # Your static access token from Directus
    sample_size = 5  # Number of examples to fetch per field

    print("\nDirectus Schema Export Tool with Real Data Examples")
    print("==================================================")
    print(f"Base URL: {base_url}")
    print(f"Access Token used: {access_token[:5]}..." if len(access_token) > 5 else "Access Token not set")
    print(f"Sample size: {sample_size} examples per field")
    print("==================================================\n")

    exporter = DirectusSchemaExporter(base_url, access_token, sample_size)
    schema = exporter.export_schema()
    
    # Print the schema in a clean format
    print(json.dumps(schema, indent=2))

if __name__ == '__main__':
    main()