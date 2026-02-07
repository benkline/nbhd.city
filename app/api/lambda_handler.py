"""
AWS Lambda handler for FastAPI application.
Uses Mangum to adapt FastAPI for Lambda + API Gateway.
"""

from mangum import Mangum
from main import app

# Create Lambda handler
handler = Mangum(app, lifespan="off")
