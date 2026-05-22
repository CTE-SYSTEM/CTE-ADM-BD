import 'dotenv/config';
import http from 'http';
import app from './app/app.js';
import { env } from './config/env.js';
import { initializeNotifications } from './services/notifications.js';

const server = http.createServer(app);
initializeNotifications(server, env.allowedOrigins);

server.listen(env.port, '0.0.0.0', () => {
  console.log('\n ==========================================');
  console.log(`   SERVIDOR CORRIENDO EN: http://localhost:${env.port}`);
  console.log(`   MODO: ${env.nodeEnv}`);
  console.log('   SISTEMA: Centro Tecnico Electronico');
  console.log('   ==========================================\n');
});
