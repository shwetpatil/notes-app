import swaggerJsdoc from 'swagger-jsdoc';
import { serverConfig, appConfig } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes Application API',
      version: '2.0.0',
      description: 'Comprehensive API documentation for the Notes Application with advanced features including caching, real-time updates, and full-text search.',
      contact: {
        name: 'API Support',
        email: 'support@notes-app.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${serverConfig.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.notes-app.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
          description: 'Session-based authentication using HTTP-only cookies',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'An error occurred',
            },
            details: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clh1234567890',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clh1234567890',
            },
            title: {
              type: 'string',
              example: 'My Note Title',
            },
            content: {
              type: 'string',
              example: 'Note content in markdown...',
            },
            contentFormat: {
              type: 'string',
              enum: ['markdown', 'html', 'plain'],
              example: 'markdown',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['javascript', 'typescript'],
            },
            color: {
              type: 'string',
              nullable: true,
              example: '#FF5733',
            },
            isPinned: {
              type: 'boolean',
              example: false,
            },
            isFavorite: {
              type: 'boolean',
              example: false,
            },
            isArchived: {
              type: 'boolean',
              example: false,
            },
            isTrashed: {
              type: 'boolean',
              example: false,
            },
            folderId: {
              type: 'string',
              nullable: true,
              example: 'clh1234567890',
            },
            userId: {
              type: 'string',
              example: 'clh1234567890',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Folder: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clh1234567890',
            },
            name: {
              type: 'string',
              example: 'Work Notes',
            },
            color: {
              type: 'string',
              nullable: true,
              example: '#4CAF50',
            },
            userId: {
              type: 'string',
              example: 'clh1234567890',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100,
            },
            page: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 20,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasMore: {
              type: 'boolean',
              example: true,
            },
          },
        },
        SearchResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            rank: {
              type: 'number',
              description: 'Relevance score',
              example: 0.607927,
            },
            headline: {
              type: 'string',
              description: 'Search result snippet with highlighted terms',
              example: 'Learn <b>JavaScript</b> fundamentals...',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Authentication required',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Validation failed',
                details: {
                  field: 'email',
                  message: 'Invalid email format',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Too many requests, please try again later',
              },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Notes',
        description: 'Note CRUD operations',
      },
      {
        name: 'Search',
        description: 'Full-text search and autocomplete',
      },
      {
        name: 'Folders',
        description: 'Folder management',
      },
      {
        name: 'Sharing',
        description: 'Note sharing functionality',
      },
      {
        name: 'Templates',
        description: 'Note templates',
      },
      {
        name: 'Export',
        description: 'Export notes to various formats',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
