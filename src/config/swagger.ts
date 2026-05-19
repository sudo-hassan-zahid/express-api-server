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
      ],
      components: {
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
                  token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                  user: {
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
