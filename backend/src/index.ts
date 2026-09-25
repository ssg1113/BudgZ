import { app } from './app';
import { config } from './config';
import { storage } from './db/storage';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 Initializing BudgZ Personal Finance Tracker API...');
  console.log('----------------------------------------------------');

  await storage.init();

  const server = app.listen(config.port, () => {
    console.log(`✅ BudgZ API Server running at http://localhost:${config.port}`);
    console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`📊 Mode: ${config.nodeEnv}`);
    console.log('----------------------------------------------------');
  });

  const shutdown = async () => {
    console.log('\n🛑 Shutting down BudgZ API Server gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  console.error('❌ Failed to start BudgZ API Server:', err);
  process.exit(1);
});
