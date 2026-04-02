import requests
import json

# Login first
login_url = 'http://127.0.0.1:8000/api/auth/login/'
login_data = {
    'username': 'admin',
    'password': 'admin123'
}

response = requests.post(login_url, json=login_data)
if response.status_code == 200:
    tokens = response.json()
    access_token = tokens['access']
    print(f"✅ Login successful!")
    
    # Create a draft invoice
    draft_url = 'http://127.0.0.1:8000/api/drafts/'
    headers = {'Authorization': f'Bearer {access_token}'}
    
    draft_data = {
        'title': 'Sample Invoice Draft',
        'type': 'invoice',
        'company_name': 'ABC Corporation',
        'grand_total': 1250.50,
        'draft_data': {
            'items': [
                {'description': 'Product A', 'quantity': 10, 'price': 100},
                {'description': 'Product B', 'quantity': 5, 'price': 50}
            ],
            'notes': 'Draft in progress'
        }
    }
    
    response = requests.post(draft_url, json=draft_data, headers=headers)
    if response.status_code == 201:
        print(f"✅ Invoice draft created: {response.json()}")
    else:
        print(f"❌ Failed to create invoice draft: {response.status_code}")
        print(response.text)
    
    # Create a draft quotation
    quotation_draft = {
        'title': 'Sample Quotation Draft',
        'type': 'quotation',
        'company_name': 'XYZ Industries',
        'grand_total': 2500.00,
        'draft_data': {
            'items': [
                {'description': 'Service A', 'quantity': 20, 'price': 125}
            ],
            'notes': 'Pending client approval'
        }
    }
    
    response = requests.post(draft_url, json=quotation_draft, headers=headers)
    if response.status_code == 201:
        print(f"✅ Quotation draft created: {response.json()}")
    else:
        print(f"❌ Failed to create quotation draft: {response.status_code}")
        print(response.text)
    
    # List all drafts
    response = requests.get(draft_url, headers=headers)
    if response.status_code == 200:
        result = response.json()
        # Handle both dict with 'results' key (paginated) or direct list
        drafts = result.get('results', result) if isinstance(result, dict) else result
        print(f"\n✅ Total drafts: {len(drafts)}")
        for draft in drafts:
            if isinstance(draft, dict):
                print(f"  - {draft['type'].upper()}: {draft['title']} (${draft.get('grand_total', 0)})")
    else:
        print(f"❌ Failed to list drafts: {response.status_code}")
else:
    print(f"❌ Login failed: {response.status_code}")
    print(response.text)
