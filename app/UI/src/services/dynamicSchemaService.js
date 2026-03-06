/**
 * Dynamic Schema Service - SSG-022
 *
 * Transforms inferred template schemas into form fields and validators.
 * Handles fetching schemas from API and converting them to React/form-usable format.
 */

import apiClient from '../lib/api';

/**
 * Fetch the inferred schema for a specific content type from a template
 */
export async function getContentTypeSchema(templateId, contentType) {
  try {
    const response = await apiClient.get(`/api/templates/${templateId}/content-types`);
    const contentTypes = response.data?.data?.content_types || {};
    return contentTypes[contentType] || null;
  } catch (error) {
    console.error(`Failed to fetch schema for ${templateId}/${contentType}:`, error);
    return null;
  }
}

/**
 * Map JSON schema type to appropriate React component type
 */
export function getFieldType(schemaField) {
  if (!schemaField || !schemaField.type) {
    return 'text'; // Default to text
  }

  switch (schemaField.type) {
    case 'string':
      if (schemaField.format === 'date') return 'date';
      if (schemaField.format === 'date-time') return 'datetime';
      if (schemaField.format === 'uri') return 'url';
      if (schemaField.enum) return 'select';
      return 'text';

    case 'integer':
    case 'number':
      return 'number';

    case 'boolean':
      return 'checkbox';

    case 'array':
      if (schemaField.items?.type === 'string') return 'tags';
      return 'array';

    case 'object':
      return 'object';

    default:
      return 'text';
  }
}

/**
 * Generate form field definitions from JSON schema
 * Returns array of field configs for form builder components
 */
export function generateFormFields(schema) {
  if (!schema || !schema.properties) {
    return [];
  }

  const requiredFields = schema.required || [];
  const fields = [];

  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
    const fieldType = getFieldType(fieldSchema);
    const isRequired = requiredFields.includes(fieldName);

    const fieldConfig = {
      name: fieldName,
      label: fieldSchema.title || fieldName.replace(/_/g, ' '),
      type: fieldType,
      required: isRequired,
      description: fieldSchema.description,
      placeholder: fieldSchema.examples?.[0],
      ...generateFieldConstraints(fieldSchema)
    };

    // Add options for select fields
    if (fieldType === 'select' && fieldSchema.enum) {
      fieldConfig.options = fieldSchema.enum.map(value => ({
        value,
        label: value
      }));
    }

    // Add tags configuration
    if (fieldType === 'tags') {
      fieldConfig.separator = ',';
      fieldConfig.maxTags = fieldSchema.maxItems;
    }

    fields.push(fieldConfig);
  });

  return fields;
}

/**
 * Extract validation constraints from JSON schema field
 */
function generateFieldConstraints(fieldSchema) {
  const constraints = {};

  if (fieldSchema.minLength !== undefined) {
    constraints.minLength = fieldSchema.minLength;
  }

  if (fieldSchema.maxLength !== undefined) {
    constraints.maxLength = fieldSchema.maxLength;
  }

  if (fieldSchema.minimum !== undefined) {
    constraints.min = fieldSchema.minimum;
  }

  if (fieldSchema.maximum !== undefined) {
    constraints.max = fieldSchema.maximum;
  }

  if (fieldSchema.pattern) {
    constraints.pattern = fieldSchema.pattern;
  }

  return constraints;
}

/**
 * Validate content against schema
 * Returns { isValid: boolean, errors: { fieldName: [messages] } }
 */
export function validateContent(content, schema) {
  const errors = {};
  const requiredFields = schema.required || [];

  // Check required fields
  requiredFields.forEach(fieldName => {
    if (!content[fieldName] || content[fieldName] === '') {
      if (!errors[fieldName]) errors[fieldName] = [];
      errors[fieldName].push(`${fieldName} is required`);
    }
  });

  // Validate field types and constraints
  Object.entries(schema.properties || {}).forEach(([fieldName, fieldSchema]) => {
    const value = content[fieldName];

    if (value === undefined || value === null || value === '') {
      return; // Skip validation if not provided and not required
    }

    const fieldErrors = validateField(fieldName, value, fieldSchema);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a single field against its schema
 */
function validateField(fieldName, value, fieldSchema) {
  const errors = [];

  // Type validation
  switch (fieldSchema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
      } else {
        // String constraints
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters`);
        }
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`${fieldName} must be at most ${fieldSchema.maxLength} characters`);
        }
        if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
          errors.push(`${fieldName} format is invalid`);
        }
      }
      break;

    case 'number':
    case 'integer':
      if (typeof value !== 'number' && isNaN(Number(value))) {
        errors.push(`${fieldName} must be a number`);
      } else {
        const num = Number(value);
        if (fieldSchema.minimum !== undefined && num < fieldSchema.minimum) {
          errors.push(`${fieldName} must be at least ${fieldSchema.minimum}`);
        }
        if (fieldSchema.maximum !== undefined && num > fieldSchema.maximum) {
          errors.push(`${fieldName} must be at most ${fieldSchema.maximum}`);
        }
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} must be an array`);
      } else {
        if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
          errors.push(`${fieldName} must have at least ${fieldSchema.minItems} items`);
        }
        if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
          errors.push(`${fieldName} must have at most ${fieldSchema.maxItems} items`);
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean`);
      }
      break;
  }

  return errors;
}

/**
 * Transform form data to DynamoDB record format
 * Separates content from frontmatter based on schema
 */
export function transformToRecord(formData, schema) {
  const record = {
    frontmatter: {},
    content: formData.content || ''
  };

  // All schema fields go into frontmatter
  Object.entries(schema.properties || {}).forEach(([fieldName]) => {
    if (fieldName !== 'content' && fieldName in formData) {
      record.frontmatter[fieldName] = formData[fieldName];
    }
  });

  return record;
}

export default {
  getContentTypeSchema,
  getFieldType,
  generateFormFields,
  validateContent,
  transformToRecord
};
