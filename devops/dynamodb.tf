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

  # TTL configuration (optional, for automatic data expiration)
  # ttl {
  #   enabled        = true
  #   attribute_name = "ttl"
  # }

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}
