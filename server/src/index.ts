import os from 'node:os';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './db/migrate.js';
import { getDatabase } from './db/index.js';
import { seedDemoData } from './db/seed.js';

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

async function startServer(): Promise<void> {
  try {
    console.log('====================================================');
    console.log(` Starting ${config.SHOP_NAME} POS Server...`);
    console.log(` Location: ${config.SHOP_LOCATION}`);
    console.log('====================================================');

    // Run database migrations on startup
    console.log('[Startup] Verifying SQLite database and migrations...');
    const db = getDatabase();
    runMigrations(db);

    // If demo products don't exist yet, seed demo data automatically for first run
    const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    if (!productCountRow || productCountRow.count === 0) {
      console.log('[Startup] First run detected. Initializing realistic demo data...');
      seedDemoData(db);
    }

    const app = createApp();

    app.listen(config.PORT, config.HOST, () => {
      console.log(`✓ Server running successfully!`);
      console.log(`  Local Access:       http://localhost:${config.PORT}`);
      
      const localIps = getLocalIpAddresses();
      if (localIps.length > 0) {
        console.log(`  Shop Network (LAN): http://${localIps[0]}:${config.PORT}`);
        console.log(`  (Use this IP on tablets or phones connected to shop Wi-Fi)`);
      }
      console.log(`  Health Check:       http://localhost:${config.PORT}/api/health`);
      console.log(`  Dashboard API:      http://localhost:${config.PORT}/api/dashboard/summary`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
}

startServer();
