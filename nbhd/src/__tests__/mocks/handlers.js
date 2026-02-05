import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/templates', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'blog',
          name: 'Blog',
          description: 'Personal blog with posts and tags',
          preview: '/templates/blog-preview.png',
          author: 'nbhd.city',
          version: '1.0.0',
          tags: ['blog', 'content']
        },
        {
          id: 'project',
          name: 'Project',
          description: 'Team project showcase with gallery',
          preview: '/templates/project-preview.png',
          author: 'nbhd.city',
          version: '1.0.0',
          tags: ['project', 'portfolio']
        },
        {
          id: 'newsletter',
          name: 'Newsletter',
          description: 'Email newsletter archive',
          preview: '/templates/newsletter-preview.png',
          author: 'nbhd.city',
          version: '1.0.0',
          tags: ['newsletter', 'email']
        }
      ]
    });
  }),

  http.get('/api/sites/:siteId/prefill', () => {
    return HttpResponse.json({
      suggestions: [
        {
          field: 'author',
          value: 'Alice',
          source: 'profile',
          confidence: 1.0
        }
      ],
      template_id: 'blog',
      template_name: 'Blog Template'
    });
  }),

  // Neighborhood endpoints
  http.all('/api/nbhds/:nbhdId', ({ request }) => {
    if (request.method === 'OPTIONS') {
      return new HttpResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return HttpResponse.json({
      data: {
        id: 'nbhd-123',
        name: 'Tech Neighborhood',
        description: 'A community for tech enthusiasts',
        nbhd_did: 'did:plc:abc123',
        created_by: 'user-123',
        created_at: '2026-01-01T00:00:00Z',
        members: [],
        site_type: 'neighborhood'
      }
    });
  }),

  // Neighborhood content endpoints (NBHD-002/004)
  http.get('/api/nbhds/:nbhdId/content/welcome', () => {
    return HttpResponse.json({
      data: {
        title: 'Welcome to Our Community',
        content: '# Welcome\n\nThis is the welcome page.',
        updated_at: '2026-01-31T10:00:00Z'
      }
    });
  }),

  http.post('/api/nbhds/:nbhdId/content/welcome', () => {
    return HttpResponse.json(
      {
        data: {
          uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
          cid: 'bafyreib2rxk3rh6kzwq...',
          rkey: 'default',
          created_at: '2026-01-31T10:00:00Z'
        }
      },
      { status: 201 }
    );
  }),

  http.get('/api/nbhds/:nbhdId/content/announcements', () => {
    return HttpResponse.json({
      data: [
        {
          rkey: '3jzfcijpj2z2a',
          title: 'Community Update',
          content: 'Important community update',
          priority: 'normal',
          pinned: false,
          created_at: '2026-01-31T14:00:00Z'
        }
      ],
      meta: {
        pagination: {
          offset: 0,
          limit: 10,
          total: 1
        }
      }
    });
  }),

  http.post('/api/nbhds/:nbhdId/content/announcements', () => {
    return HttpResponse.json(
      {
        data: {
          uri: 'at://did:plc:abc123/app.nbhd.announcement/3jzfcijpj2z2a',
          cid: 'bafyreib2rxk3rh6kzwq...',
          rkey: '3jzfcijpj2z2a',
          created_at: '2026-01-31T14:00:00Z'
        }
      },
      { status: 201 }
    );
  }),

  http.delete('/api/nbhds/:nbhdId/content/announcements/:rkey', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/nbhds/:nbhdId/content/cms', () => {
    return HttpResponse.json({
      data: {
        nbhd_id: 'nbhd-123',
        nbhd_did: 'did:plc:abc123',
        welcome: {
          uri: 'at://did:plc:abc123/app.nbhd.welcome/default',
          cid: 'bafyreib2rxk3rh6kzwq...',
          rkey: 'default',
          created_at: '2026-01-31T10:00:00Z',
          updated_at: '2026-01-31T10:00:00Z',
          content_preview: 'Welcome to Our Community'
        },
        announcements: [
          {
            uri: 'at://did:plc:abc123/app.nbhd.announcement/3jzfcijpj2z2a',
            cid: 'bafyreib2rxk3rh6kzwq...',
            rkey: '3jzfcijpj2z2a',
            created_at: '2026-01-31T14:00:00Z',
            title: 'Community Update',
            priority: 'normal',
            content_preview: 'Important community update'
          }
        ],
        sites: [
          {
            id: 'site-123',
            name: 'Community Blog',
            site_type: 'project',
            status: 'published',
            url: 'https://blog.nbhd.city'
          }
        ],
        metadata: {
          uri: 'at://did:plc:abc123/app.nbhd.metadata/default',
          cid: 'bafyreib2rxk3rh6kzwq...',
          display_name: 'Tech Neighborhood',
          description: 'A community for tech enthusiasts'
        }
      }
    });
  })
];
