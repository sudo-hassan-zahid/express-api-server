import swaggerJsdoc from 'swagger-jsdoc';

const createSwaggerSpec = () =>
  swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Express API Server',
        version: '1.0.0',
        description: 'Brief API documentation for health checks and authentication endpoints.',
      },
      tags: [
        {
          name: 'Health',
          description: 'Service, database, and Redis health checks.',
        },
        {
          name: 'Auth',
          description: 'User registration and login.',
        },
        {
          name: 'Users',
          description: 'Authenticated user management.',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
          },
        },
        schemas: {
          ErrorResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Something went wrong',
              },
              error: {
                type: 'string',
                example: 'Detailed error message',
              },
              requestId: {
                type: 'string',
                example: 'a1b2c3d4',
              },
            },
          },
          HealthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'OK',
              },
              message: {
                type: 'string',
                example: 'Server is healthy',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                example: 1,
              },
              name: {
                type: 'string',
                example: 'Hassan Zahid',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'hassan@example.com',
              },
            },
          },
          UserResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'User retrieved successfully',
              },
              data: {
                $ref: '#/components/schemas/User',
              },
            },
          },
          UserListResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Users retrieved successfully',
              },
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          UpdateUserRequest: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'Hassan Zahid',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'hassan@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                minLength: 6,
                example: 'new-strong-password',
              },
            },
          },
          RegisterRequest: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: {
                type: 'string',
                example: 'Hassan Zahid',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'hassan@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                minLength: 6,
                example: 'strong-password',
              },
            },
          },
          RegisterResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'User registered successfully',
              },
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    example: 1,
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'hassan@example.com',
                  },
                },
              },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'hassan@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                example: 'strong-password',
              },
            },
          },
          LoginResponse: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Login successful',
              },
              data: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
    },
    apis: ['./src/server.ts', './src/routes/*.ts'],
  });

export default createSwaggerSpec;
