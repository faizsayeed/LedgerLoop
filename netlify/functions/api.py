import sys
import os
from pathlib import Path

# Add workspace and lambda execution roots to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

if "/var/task" not in sys.path and Path("/var/task").exists():
    sys.path.insert(0, "/var/task")

from mangum import Mangum
from backend.app.main import app

def normalize_path(path: str) -> str:
    if not path:
        return "/api"
    if path.startswith("/.netlify/functions/api"):
        path = path[len("/.netlify/functions/api"):]
    if not path.startswith("/api"):
        if not path.startswith("/"):
            path = "/" + path
        path = "/api" + (path if path != "/" else "")
    return path

mangum_handler = Mangum(app, lifespan="off")

def handler(event, context):
    # Normalize event path so FastAPI router receives standard /api routes
    path = event.get("path", "")
    event["path"] = normalize_path(path)

    # Ensure APIGateway structure compatibility for Mangum adapter
    if "resource" not in event:
        event["resource"] = "/{proxy+}"
    if "requestContext" not in event:
        event["requestContext"] = {
            "resourcePath": "/{proxy+}",
            "httpMethod": event.get("httpMethod", "GET"),
            "path": event["path"]
        }

    return mangum_handler(event, context)
