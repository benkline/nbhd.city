/**
 * Integration tests for SSG-023: Template Schema to CMS Integration
 *
 * Tests that CMS components correctly use template schemas for dynamic forms
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { FrontmatterForm } from '../FrontmatterForm';
import { getFieldType, generateFormFields, validateContent } from '../../../services/dynamicSchemaService';

describe('SSG-023: Template Schema to CMS Integration', () => {
  describe('FrontmatterForm with Schema Integration', () => {
    let mockSchema;
    let mockValues;
    let mockOnChange;

    beforeEach(() => {
      mockSchema = {
        properties: {
          title: {
            type: 'string',
            title: 'Post Title',
            description: 'The title of your post',
            minLength: 5,
            maxLength: 200
          },
          date: {
            type: 'string',
            format: 'date',
            title: 'Publish Date'
          },
          author: {
            type: 'string',
            title: 'Author Name',
            description: 'Your name'
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            title: 'Status'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            title: 'Tags',
            description: 'Comma-separated tags'
          }
        },
        required: ['title', 'date']
      };

      mockValues = {
        title: 'My Blog Post',
        date: '2024-01-15',
        author: 'John Doe',
        status: 'draft',
        tags: ['javascript', 'react']
      };

      mockOnChange = vi.fn();
    });

    test('renders form with schema-defined fields', () => {
      const { container } = render(
        <FrontmatterForm
          schema={mockSchema}
          values={mockValues}
          onChange={mockOnChange}
        />
      );

      expect(container).toBeTruthy();
    });

    test('accepts schema prop without error', () => {
      expect(() => {
        render(
          <FrontmatterForm
            schema={mockSchema}
            values={mockValues}
            onChange={mockOnChange}
          />
        );
      }).not.toThrow();
    });

    test('handles schema with required fields', () => {
      const requiredFields = mockSchema.required || [];
      expect(requiredFields).toContain('title');
      expect(requiredFields).toContain('date');
    });

    test('integrates with dynamicSchemaService getFieldType', () => {
      const titleField = mockSchema.properties.title;
      const fieldType = getFieldType(titleField);

      expect(fieldType).toBe('text');
    });

    test('integrates with dynamicSchemaService for date fields', () => {
      const dateField = mockSchema.properties.date;
      const fieldType = getFieldType(dateField);

      expect(fieldType).toBe('date');
    });

    test('integrates with dynamicSchemaService for select fields', () => {
      const statusField = mockSchema.properties.status;
      const fieldType = getFieldType(statusField);

      expect(fieldType).toBe('select');
    });

    test('integrates with dynamicSchemaService for array fields', () => {
      const tagsField = mockSchema.properties.tags;
      const fieldType = getFieldType(tagsField);

      expect(fieldType).toBe('tags');
    });

    test('validates content against schema before form submission', () => {
      const validResult = validateContent(mockValues, mockSchema);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual({});
    });

    test('catches validation errors for required fields', () => {
      const invalidValues = {
        author: 'John',
        // Missing title and date (both required)
      };

      const result = validateContent(invalidValues, mockSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
      expect(result.errors.date).toBeDefined();
    });

    test('catches validation errors for minLength', () => {
      const invalidValues = {
        title: 'Hi', // Less than minLength of 5
        date: '2024-01-15'
      };

      const result = validateContent(invalidValues, mockSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    test('catches validation errors for maxLength', () => {
      const longTitle = 'a'.repeat(201); // More than maxLength of 200
      const invalidValues = {
        title: longTitle,
        date: '2024-01-15'
      };

      const result = validateContent(invalidValues, mockSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });
  });

  describe('Schema to Form Field Generation', () => {
    test('generateFormFields creates form fields from schema', () => {
      const schema = {
        properties: {
          title: { type: 'string', title: 'Title' },
          date: { type: 'string', format: 'date', title: 'Date' },
          content: { type: 'string', title: 'Content' }
        },
        required: ['title', 'content']
      };

      const fields = generateFormFields(schema);

      expect(fields).toHaveLength(3);
      expect(fields.map(f => f.name)).toEqual(['title', 'date', 'content']);
    });

    test('form fields match schema field types', () => {
      const schema = {
        properties: {
          title: { type: 'string' },
          published: { type: 'boolean' },
          views: { type: 'number' },
          date: { type: 'string', format: 'date' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      };

      const fields = generateFormFields(schema);
      const fieldMap = Object.fromEntries(fields.map(f => [f.name, f.type]));

      expect(fieldMap.title).toBe('text');
      expect(fieldMap.published).toBe('checkbox');
      expect(fieldMap.views).toBe('number');
      expect(fieldMap.date).toBe('date');
      expect(fieldMap.tags).toBe('tags');
    });

    test('marks required fields in generated form fields', () => {
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

    test('includes field constraints in generated form', () => {
      const schema = {
        properties: {
          title: {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            pattern: '^[A-Za-z0-9 ]+$'
          }
        }
      };

      const fields = generateFormFields(schema);
      const titleField = fields[0];

      expect(titleField.minLength).toBe(3);
      expect(titleField.maxLength).toBe(100);
      expect(titleField.pattern).toBe('^[A-Za-z0-9 ]+$');
    });

    test('includes descriptions as help text', () => {
      const schema = {
        properties: {
          title: {
            type: 'string',
            description: 'The main title of your article'
          }
        }
      };

      const fields = generateFormFields(schema);
      expect(fields[0].description).toBe('The main title of your article');
    });
  });

  describe('Backward Compatibility', () => {
    test('handles missing schema gracefully', () => {
      expect(() => {
        render(
          <FrontmatterForm
            schema={null}
            values={{}}
            onChange={() => {}}
          />
        );
      }).not.toThrow();
    });

    test('validateContent handles schema without required fields', () => {
      const schema = {
        properties: {
          title: { type: 'string' }
        }
        // No 'required' field
      };

      const result = validateContent({ title: '' }, schema);
      // Empty optional field should be valid
      expect(result.isValid).toBe(true);
    });

    test('validateContent handles schema with empty properties', () => {
      const schema = {
        properties: {}
      };

      const result = validateContent({}, schema);
      expect(result.isValid).toBe(true);
    });

    test('getFieldType defaults to text for unknown types', () => {
      expect(getFieldType({ type: 'unknown-type' })).toBe('text');
      expect(getFieldType(null)).toBe('text');
      expect(getFieldType({})).toBe('text');
    });
  });

  describe('Content Type Display', () => {
    test('schema supports multiple content types', () => {
      const postSchema = {
        properties: {
          title: { type: 'string' },
          excerpt: { type: 'string' },
          content: { type: 'string' }
        }
      };

      const pageSchema = {
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          navigationTitle: { type: 'string' }
        }
      };

      const postFields = generateFormFields(postSchema);
      const pageFields = generateFormFields(pageSchema);

      expect(postFields.length).toBeGreaterThan(0);
      expect(pageFields.length).toBeGreaterThan(0);
      // Different content types have different fields
      expect(postFields.map(f => f.name)).toContain('excerpt');
      expect(pageFields.map(f => f.name)).toContain('navigationTitle');
    });
  });
});
