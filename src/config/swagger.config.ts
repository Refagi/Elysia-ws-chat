import { swagger } from '@elysiajs/swagger';

export const swaggerConfig = swagger({
    documentation: {
        info: {
            title: 'Real-time Chat API',
            version: '1.0.0',
            description: 'API untuk real-time chat dengan WebSocket dan REST'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Auth management'},
            { name: 'Messages', description: 'Message operations' },
            { name: 'Users', description: 'User management' },
            { name: 'WebSocket', description: 'WebSocket connection info' }
        ]
    },
});
