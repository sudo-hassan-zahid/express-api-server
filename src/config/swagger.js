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
      servers: [
        {
          url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
          description: 'Local server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Service and database health checks.',
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
              status: {
                type: 'string',
                example: 'ERROR',
              },
              message: {
                type: 'string',
                example: 'Something went wrong',
              },
              error: {
                type: 'string',
                example: 'Detailed error message',
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
              status: {
                type: 'string',
                example: 'OK',
              },
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
    apis: ['./src/server.js', './src/routes/*.js'],
  });

export default createSwaggerSpec;
