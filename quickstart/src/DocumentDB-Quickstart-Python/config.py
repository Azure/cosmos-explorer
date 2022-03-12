import os

settings = {
    'host': os.environ.get('ACCOUNT_HOST', 'https://localhost:8081'),
    'master_key': os.environ.get('ACCOUNT_KEY', 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=='),
    'database_id': os.environ.get('COSMOS_DATABASE', 'db'),
    'container_id': os.environ.get('COSMOS_CONTAINER', 'items'),
}