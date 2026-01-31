/**
 * Lambda@Edge Origin Request Handler
 * Maps subdomain requests to S3 paths based on DynamoDB lookup
 *
 * Architecture:
 * 1. Extract subdomain from Host header
 * 2. Query DynamoDB GSI8 for subdomain → site mapping
 * 3. Rewrite S3 origin path to /sites/{user_did}/{site_id}/
 * 4. Return 404 if subdomain not found
 * 5. Cache results in memory (60s TTL)
 */

const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

// Initialize DynamoDB client with minimal config (Lambda@Edge compatible)
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

// In-memory cache with 60s TTL
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

/**
 * Extract subdomain from host header
 * Examples:
 *   "alice.nbhd.city" → "alice"
 *   "demo.nbhd.city" → "demo"
 *   "nbhd.city" → null (no subdomain)
 */
function extractSubdomain(host) {
  if (!host) return null;

  const domain = process.env.SITES_DOMAIN || "nbhd.city";
  const domainPattern = new RegExp(`^([a-z0-9-]+)\\.${domain.replace(/\./g, "\\.")}$`, "i");
  const match = host.match(domainPattern);

  return match ? match[1].toLowerCase() : null;
}

/**
 * Query DynamoDB for subdomain mapping
 * Expects items with structure:
 * {
 *   PK: "USER#{user_did}",
 *   SK: "SITE#{site_id}",
 *   subdomain: "alice",
 *   user_did: "did:plc:abc123",
 *   site_id: "site-uuid-456"
 * }
 */
async function lookupSubdomain(subdomain) {
  // Check memory cache first
  const cacheKey = `subdomain:${subdomain}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for subdomain: ${subdomain}`);
    return cached.data;
  }

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME;

    const params = {
      TableName: tableName,
      IndexName: "GSI8",
      KeyConditionExpression: "subdomain = :subdomain",
      ExpressionAttributeValues: {
        ":subdomain": { S: subdomain }
      },
      ProjectionExpression: "user_did,site_id,#status",
      ExpressionAttributeNames: {
        "#status": "status" // status is a reserved word in DynamoDB
      },
      Limit: 1
    };

    const command = new QueryCommand(params);
    const response = await dynamodb.send(command);

    if (!response.Items || response.Items.length === 0) {
      console.log(`No item found for subdomain: ${subdomain}`);
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }

    const item = unmarshall(response.Items[0]);

    // Verify site is published/active
    if (item.status && item.status !== "published") {
      console.log(`Subdomain ${subdomain} exists but status is ${item.status}`);
      return null;
    }

    cache.set(cacheKey, { data: item, timestamp: Date.now() });
    return item;
  } catch (error) {
    console.error(`Error querying DynamoDB for subdomain ${subdomain}:`, error);
    return null;
  }
}

/**
 * Return 404 response
 */
function create404Response() {
  return {
    status: "404",
    statusDescription: "Not Found",
    httpVersion: "HTTP/1.1",
    headers: {
      "content-type": [{ key: "Content-Type", value: "text/html; charset=utf-8" }],
      "cache-control": [{ key: "Cache-Control", value: "max-age=300" }]
    },
    body: `<!DOCTYPE html>
<html>
<head>
  <title>404 Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 40px; }
    h1 { font-size: 32px; margin: 0; }
    p { color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>404 Not Found</h1>
  <p>This site is not available.</p>
</body>
</html>`
  };
}

/**
 * Lambda@Edge origin-request handler
 * Triggered before request reaches origin (S3)
 */
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const host = request.headers.host?.[0]?.value;

  if (!host) {
    console.error("No host header found");
    return create404Response();
  }

  console.log(`Processing request for host: ${host}`);

  // Extract subdomain
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    console.log(`No subdomain found in host: ${host}`);
    return create404Response();
  }

  // Look up subdomain in DynamoDB
  const siteMapping = await lookupSubdomain(subdomain);

  if (!siteMapping) {
    console.log(`Subdomain ${subdomain} not found in DynamoDB`);
    return create404Response();
  }

  // Rewrite origin path for S3
  // S3 path format: /sites/{user_did}/{site_id}/
  const newPath = `/sites/${siteMapping.user_did}/${siteMapping.site_id}`;

  console.log(`Routing subdomain '${subdomain}' to S3 path: ${newPath}`);

  // Update request with new origin path
  request.origin.s3.path = newPath;

  // Ensure uri starts with / (CloudFront requirement)
  if (!request.uri.startsWith("/")) {
    request.uri = "/" + request.uri;
  }

  // Forward updated request to origin
  return request;
};
