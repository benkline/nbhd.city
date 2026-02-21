resource "aws_dynamodb_table" "nbhd_city" {
  name           = "${var.project_name}-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "PK"
  range_key      = "SK"

  # Primary Key Attributes
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI1: List all neighborhoods sorted by creation date
  attribute {
    name = "entity_type"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  # GSI2: Name lookup for uniqueness check
  attribute {
    name = "name_lower"
    type = "S"
  }

  # GSI3: Get user's memberships
  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "joined_at"
    type = "S"
  }

  # GSI7: Query AT Protocol records by collection type
  attribute {
    name = "user_did"
    type = "S"
  }

  attribute {
    name = "record_type_created"
    type = "S"
  }

  # GSI8: Subdomain lookup for static site routing
  attribute {
    name = "subdomain"
    type = "S"
  }

  # GSI9: Neighborhood sites lookup by type
  attribute {
    name = "nbhd_id"
    type = "S"
  }

  attribute {
    name = "site_type"
    type = "S"
  }

  # Chat GSI: Channels by neighborhood
  attribute {
    name = "nbhd_id_chat"
    type = "S"
  }

  attribute {
    name = "channel_sort"
    type = "S"
  }

  # Chat GSI: DMs by user
  attribute {
    name = "dm_participant"
    type = "S"
  }

  attribute {
    name = "dm_created"
    type = "S"
  }

  # Chat GSI: WS connections by user
  attribute {
    name = "ws_user_did"
    type = "S"
  }

  attribute {
    name = "ws_connected_at"
    type = "S"
  }

  # Global Secondary Index 1
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "entity_type"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # Global Secondary Index 2
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "name_lower"
    range_key       = "SK"
    projection_type = "KEYS_ONLY"
  }

  # Global Secondary Index 3
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "user_id"
    range_key       = "joined_at"
    projection_type = "ALL"
  }

  # Global Secondary Index 7: AT Protocol Records by Collection Type
  # Enables queries like: Get all app.nbhd.blog.post records for a user
  global_secondary_index {
    name            = "GSI7"
    hash_key        = "user_did"
    range_key       = "record_type_created"
    projection_type = "ALL"
  }

  # Global Secondary Index 8: Subdomain lookup for static site routing
  # Enables Lambda@Edge to map subdomains to sites
  global_secondary_index {
    name            = "GSI8"
    hash_key        = "subdomain"
    range_key       = "SK"
    projection_type = "ALL"
  }

  # Global Secondary Index 9: Neighborhood sites lookup by type
  # Enables efficient querying of sites by neighborhood and type
  global_secondary_index {
    name            = "GSI9"
    hash_key        = "nbhd_id"
    range_key       = "site_type"
    projection_type = "ALL"
  }

  # Chat GSI: Channels by neighborhood (for nbhrs-chat plugin)
  # Enables efficient querying of channels within a neighborhood
  global_secondary_index {
    name            = "ChatChannelsByNbhd"
    hash_key        = "nbhd_id_chat"
    range_key       = "channel_sort"
    projection_type = "ALL"
  }

  # Chat GSI: DMs by user (for nbhrs-chat plugin)
  # Enables efficient querying of DM threads for a user
  global_secondary_index {
    name            = "ChatDMsByUser"
    hash_key        = "dm_participant"
    range_key       = "dm_created"
    projection_type = "ALL"
  }

  # Chat GSI: WS connections by user (for nbhrs-chat plugin)
  # Enables efficient querying of active WebSocket connections for a user
  global_secondary_index {
    name            = "ChatWSByUser"
    hash_key        = "ws_user_did"
    range_key       = "ws_connected_at"
    projection_type = "ALL"
  }

  # Enable Point-in-Time Recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Enable Server-Side Encryption
  server_side_encryption {
    enabled = true
  }

  # Enable DynamoDB Streams (optional, for event processing)
  stream_enabled   = var.enable_streams
  stream_view_type = var.enable_streams ? "NEW_AND_OLD_IMAGES" : null

  # TTL configuration (for automatic data expiration)
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}
