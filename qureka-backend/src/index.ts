import http from 'http';

import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { setupSocketServer } from './sockets';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  setupSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server', error);
  process.exit(1);
});


