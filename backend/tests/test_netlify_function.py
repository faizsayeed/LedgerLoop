import json
from netlify.functions.api import handler

def test_netlify_function_health():
    event = {
        "path": "/api/health",
        "httpMethod": "GET",
        "headers": {},
        "queryStringParameters": None,
        "body": None,
        "isBase64Encoded": False
    }
    resp = handler(event, {})
    assert resp["statusCode"] == 200
    data = json.loads(resp["body"])
    assert data["status"] == "healthy"
    assert "Apex" in data["company"]

def test_netlify_function_overview():
    event = {
        "path": "/api/overview",
        "httpMethod": "GET",
        "headers": {},
        "queryStringParameters": None,
        "body": None,
        "isBase64Encoded": False
    }
    resp = handler(event, {})
    assert resp["statusCode"] == 200
    data = json.loads(resp["body"])
    assert "company" in data
    assert "kpis" in data
    assert len(data["priority_queue"]) > 0

def test_netlify_function_prefixed_path():
    event = {
        "path": "/.netlify/functions/api/health",
        "httpMethod": "GET",
        "headers": {},
        "queryStringParameters": None,
        "body": None,
        "isBase64Encoded": False
    }
    resp = handler(event, {})
    assert resp["statusCode"] == 200
    data = json.loads(resp["body"])
    assert data["status"] == "healthy"
