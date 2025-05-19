import { app } from './index'
import config from './config/config';
import { Logger } from '../src/config/logger';

app.listen(config.port);

const logger = new Logger();

logger.info(`🚀 Server running at http://localhost:${config.port}/v1`);
logger.info(`📚 Swagger docs at http://localhost:${config.port}/swagger`);
logger.info(`🔌 WebSocket at ws://localhost:${config.port}/v1/ws`);
