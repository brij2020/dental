#!/bin/bash

# Procedure API Testing Examples
# Replace YOUR_AUTH_TOKEN with the actual JWT token from login
# Replace CLINIC_ID with your clinic's ID

AUTH_TOKEN="YOUR_AUTH_TOKEN"
CLINIC_ID="YOUR_CLINIC_ID"
API_BASE="http://127.0.0.1:8080"

echo "=== PROCEDURE API TEST EXAMPLES ==="
echo ""

# 1. GET ALL PROCEDURES FOR A CLINIC
echo "1. Fetch all procedures for your clinic:"
echo "curl -X GET '${API_BASE}/api/procedures?clinic_id=${CLINIC_ID}' \\"
echo "  -H 'Authorization: Bearer ${AUTH_TOKEN}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# 2. CREATE A NEW PROCEDURE
echo "2. Create a new procedure:"
echo "curl -X POST '${API_BASE}/api/procedures' \\"
echo "  -H 'Authorization: Bearer ${AUTH_TOKEN}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"clinic_id\": \"${CLINIC_ID}\",
    \"name\": \"Root Canal Therapy\",
    \"procedure_type\": \"Endodontic\",
    \"description\": \"Complete endodontic treatment with follow-up\",
    \"cost\": 2000,
    \"note\": \"Includes X-rays and consultation\"
  }'"
echo ""

# 3. UPDATE A PROCEDURE
echo "3. Update a procedure (replace PROCEDURE_ID):"
echo "curl -X PUT '${API_BASE}/api/procedures/PROCEDURE_ID' \\"
echo "  -H 'Authorization: Bearer ${AUTH_TOKEN}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"name\": \"Advanced Root Canal Therapy\",
    \"cost\": 2500,
    \"description\": \"Updated description\",
    \"note\": \"Updated note\"
  }'"
echo ""

# 4. GET SINGLE PROCEDURE
echo "4. Get a single procedure (replace PROCEDURE_ID):"
echo "curl -X GET '${API_BASE}/api/procedures/PROCEDURE_ID' \\"
echo "  -H 'Authorization: Bearer ${AUTH_TOKEN}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# 5. DELETE A PROCEDURE
echo "5. Delete a procedure (replace PROCEDURE_ID):"
echo "curl -X DELETE '${API_BASE}/api/procedures/PROCEDURE_ID' \\"
echo "  -H 'Authorization: Bearer ${AUTH_TOKEN}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Available Procedure Types
echo "=== AVAILABLE PROCEDURE TYPES ==="
echo "1. General"
echo "2. Cosmetic"
echo "3. Surgical"
echo "4. Diagnostic"
echo "5. Preventive"
echo "6. Restorative"
echo "7. Orthodontic"
echo "8. Prosthodontic"
echo "9. Periodontal"
echo "10. Endodontic"
echo "11. Other"
echo ""

# Example Success Response
echo "=== EXAMPLE SUCCESS RESPONSE (GET) ==="
echo "{
  \"data\": [
    {
      \"_id\": \"507f1f77bcf86cd799439011\",
      \"clinic_id\": \"clinic-001\",
      \"name\": \"Root Canal Therapy\",
      \"procedure_type\": \"Endodontic\",
      \"description\": \"Complete endodontic treatment\",
      \"cost\": 2000,
      \"note\": \"Includes consultation\",
      \"is_active\": true,
      \"created_at\": \"2026-01-21T10:00:00Z\",
      \"updated_at\": \"2026-01-21T10:00:00Z\"
    }
  ]
}"
echo ""

# Example Error Response
echo "=== EXAMPLE ERROR RESPONSE ==="
echo "{
  \"message\": \"clinic_id is required\"
}"
echo ""

echo "=== HTTP STATUS CODES ==="
echo "200 OK - Successful GET/PUT/DELETE"
echo "201 Created - Successful POST"
echo "400 Bad Request - Missing or invalid parameters"
echo "404 Not Found - Procedure or resource not found"
echo "500 Internal Server Error - Server error"
