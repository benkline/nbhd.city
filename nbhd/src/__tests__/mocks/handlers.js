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
  })
];
