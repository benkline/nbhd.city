/**
 * Tests for Dynamic Schema Service - SSG-022
 */

import {
  getFieldType,
  generateFormFields,
  validateContent,
  transformToRecord
} from '../dynamicSchemaService';

describe('Dynamic Schema Service', () => {
  describe('getFieldType', () => {
    test('maps string type to text field', () => {
      const field = { type: 'string' };
      expect(getFieldType(field)).toBe('text');
    });

    test('maps date format string to date field', () => {
      const field = { type: 'string', format: 'date' };
      expect(getFieldType(field)).toBe('date');
    });

    test('maps datetime format string to datetime field', () => {
      const field = { type: 'string', format: 'date-time' };
      expect(getFieldType(field)).toBe('datetime');
    });

    test('maps uri format string to url field', () => {
      const field = { type: 'string', format: 'uri' };
      expect(getFieldType(field)).toBe('url');
    });

    test('maps enum string to select field', () => {
      const field = { type: 'string', enum: ['draft', 'published'] };
      expect(getFieldType(field)).toBe('select');
    });

    test('maps integer type to number field', () => {
      const field = { type: 'integer' };
      expect(getFieldType(field)).toBe('number');
    });

    test('maps number type to number field', () => {
      const field = { type: 'number' };
      expect(getFieldType(field)).toBe('number');
    });

    test('maps boolean type to checkbox field', () => {
      const field = { type: 'boolean' };
      expect(getFieldType(field)).toBe('checkbox');
    });

    test('maps array of strings to tags field', () => {
      const field = { type: 'array', items: { type: 'string' } };
      expect(getFieldType(field)).toBe('tags');
    });

    test('maps generic array to array field', () => {
      const field = { type: 'array' };
      expect(getFieldType(field)).toBe('array');
    });

    test('maps object type to object field', () => {
      const field = { type: 'object' };
      expect(getFieldType(field)).toBe('object');
    });

    test('defaults to text for unknown types', () => {
      expect(getFieldType(null)).toBe('text');
      expect(getFieldType({})).toBe('text');
      expect(getFieldType({ type: 'unknown' })).toBe('text');
    });
  });

  describe('generateFormFields', () => {
    test('generates empty array for null schema', () => {
      expect(generateFormFields(null)).toEqual([]);
      expect(generateFormFields({})).toEqual([]);
    });

    test('generates field for simple string property', () => {
      const schema = {
        properties: {
          title: { type: 'string' }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('title');
      expect(fields[0].type).toBe('text');
    });

    test('marks required fields correctly', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['title']
      };
      const fields = generateFormFields(schema);

      const titleField = fields.find(f => f.name === 'title');
      const descField = fields.find(f => f.name === 'description');

      expect(titleField.required).toBe(true);
      expect(descField.required).toBe(false);
    });

    test('uses title from schema if available', () => {
      const schema = {
        properties: {
          post_title: { type: 'string', title: 'Post Title' }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields[0].label).toBe('Post Title');
    });

    test('generates label from field name if no title', () => {
      const schema = {
        properties: {
          post_title: { type: 'string' }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields[0].label).toBe('post title');
    });

    test('includes description and placeholder', () => {
      const schema = {
        properties: {
          title: {
            type: 'string',
            description: 'The post title',
            examples: ['My Blog Post']
          }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields[0].description).toBe('The post title');
      expect(fields[0].placeholder).toBe('My Blog Post');
    });

    test('includes constraints minLength and maxLength', () => {
      const schema = {
        properties: {
          title: {
            type: 'string',
            minLength: 5,
            maxLength: 100
          }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields[0].minLength).toBe(5);
      expect(fields[0].maxLength).toBe(100);
    });

    test('includes enum options for select fields', () => {
      const schema = {
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived']
          }
        }
      };
      const fields = generateFormFields(schema);
      expect(fields[0].options).toHaveLength(3);
      expect(fields[0].options[0]).toEqual({ value: 'draft', label: 'draft' });
    });
  });

  describe('validateContent', () => {
    test('validates required fields', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['title']
      };

      const result = validateContent({ content: 'Some content' }, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    test('passes validation when all required fields present', () => {
      const schema = {
        properties: {
          title: { type: 'string' }
        },
        required: ['title']
      };

      const result = validateContent({ title: 'My Title' }, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('validates string length constraints', () => {
      const schema = {
        properties: {
          title: {
            type: 'string',
            minLength: 5,
            maxLength: 20
          }
        }
      };

      const tooShort = validateContent({ title: 'Hi' }, schema);
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.title).toBeDefined();

      const tooLong = validateContent({ title: 'This is a very long title that exceeds max length' }, schema);
      expect(tooLong.isValid).toBe(false);

      const valid = validateContent({ title: 'Valid' }, schema);
      expect(valid.isValid).toBe(true);
    });

    test('validates number ranges', () => {
      const schema = {
        properties: {
          rating: {
            type: 'number',
            minimum: 1,
            maximum: 5
          }
        }
      };

      const tooLow = validateContent({ rating: 0 }, schema);
      expect(tooLow.isValid).toBe(false);

      const tooHigh = validateContent({ rating: 10 }, schema);
      expect(tooHigh.isValid).toBe(false);

      const valid = validateContent({ rating: 3 }, schema);
      expect(valid.isValid).toBe(true);
    });

    test('validates array constraints', () => {
      const schema = {
        properties: {
          tags: {
            type: 'array',
            minItems: 1,
            maxItems: 5
          }
        }
      };

      const empty = validateContent({ tags: [] }, schema);
      expect(empty.isValid).toBe(false);

      const tooMany = validateContent({ tags: [1, 2, 3, 4, 5, 6] }, schema);
      expect(tooMany.isValid).toBe(false);

      const valid = validateContent({ tags: ['tag1', 'tag2'] }, schema);
      expect(valid.isValid).toBe(true);
    });

    test('validates pattern matching', () => {
      const schema = {
        properties: {
          email: {
            type: 'string',
            pattern: '^[^@]+@[^@]+\\.[^@]+$'
          }
        }
      };

      const invalid = validateContent({ email: 'not-an-email' }, schema);
      expect(invalid.isValid).toBe(false);

      const valid = validateContent({ email: 'test@example.com' }, schema);
      expect(valid.isValid).toBe(true);
    });

    test('skips validation for optional fields not provided', () => {
      const schema = {
        properties: {
          title: { type: 'string', minLength: 10 },
          optional: { type: 'string' }
        }
      };

      const result = validateContent({}, schema);
      expect(result.isValid).toBe(true); // no required fields specified, so all optional
      expect(result.errors).toEqual({});
    });
  });

  describe('transformToRecord', () => {
    test('transforms form data to record format', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          date: { type: 'string', format: 'date' },
          content: { type: 'string' }
        }
      };

      const formData = {
        title: 'My Post',
        date: '2024-01-01',
        content: 'Post content here'
      };

      const record = transformToRecord(formData, schema);

      expect(record.frontmatter).toEqual({
        title: 'My Post',
        date: '2024-01-01'
      });
      expect(record.content).toBe('Post content here');
    });

    test('excludes content from frontmatter', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          content: { type: 'string' }
        }
      };

      const formData = {
        title: 'My Post',
        content: 'Post body'
      };

      const record = transformToRecord(formData, schema);

      // content should only be in record.content, not in frontmatter
      expect(record.frontmatter.content).toBeUndefined();
      expect(record.content).toBe('Post body');
    });

    test('handles missing optional fields', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        }
      };

      const formData = {
        title: 'My Post'
      };

      const record = transformToRecord(formData, schema);

      expect(record.frontmatter.title).toBe('My Post');
      expect(record.frontmatter.description).toBeUndefined();
    });

    test('preserves complex field types', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          tags: { type: 'array' },
          metadata: { type: 'object' },
          content: { type: 'string' }
        }
      };

      const formData = {
        title: 'My Post',
        tags: ['tag1', 'tag2'],
        metadata: { author: 'John', version: 1 },
        content: 'Post content'
      };

      const record = transformToRecord(formData, schema);

      expect(record.frontmatter.tags).toEqual(['tag1', 'tag2']);
      expect(record.frontmatter.metadata).toEqual({ author: 'John', version: 1 });
    });
  });
});
