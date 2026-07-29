import fs from 'fs';
import path from 'path';

/**
 * Script da Etapa 1 — Inventário Completo do Sistema (Fase -1)
 * Mapeia a estrutura completa do Mundo LK Enterprise antes das refatorações da Release 2.2.9.
 */
function runInventory() {
  const rootDir = process.cwd();
  const dateStr = new Date().toISOString().split('T')[0];
  const auditDir = path.join(rootDir, 'system_audits');

  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  const inventory = {
    release: '2.2.9',
    timestamp: new Date().toISOString(),
    pages: [] as string[],
    apiRoutes: [] as string[],
    components: [] as string[],
    repositories: [] as string[],
    services: [] as string[],
    firestoreCollections: [
      'users',
      'user_preferences',
      'ai_memory',
      'offers',
      'products',
      'trash_products',
      'collections',
      'schedules',
      'backup_logs',
      'system_logs',
      'export_jobs',
      'campaigns',
      'campaign_events',
      'analytics_events',
      'automation_rules',
      'automation_executions',
      'marketplace_listings',
      'marketplace_listing_attempts',
      'marketplace_health',
      'marketplace_operation_logs',
      'offer_generated_contents',
      'marketplace_connections',
      'prompts',
      'notifications',
      'extraction_cache',
      'analytics',
    ],
    requiredEnvVars: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'GEMINI_API_KEY',
      'OPENAI_API_KEY',
    ],
  };

  // Scan App Pages
  const appDashboardDir = path.join(rootDir, 'src', 'app', '(dashboard)');
  if (fs.existsSync(appDashboardDir)) {
    const items = fs.readdirSync(appDashboardDir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        inventory.pages.push(`/(dashboard)/${item.name}`);
      }
    }
  }

  // Scan API Routes
  const apiDir = path.join(rootDir, 'src', 'app', 'api');
  if (fs.existsSync(apiDir)) {
    const scanDir = (dir: string, routePath: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          scanDir(path.join(dir, item.name), `${routePath}/${item.name}`);
        } else if (item.name === 'route.ts' || item.name === 'route.js') {
          inventory.apiRoutes.push(routePath);
        }
      }
    };
    scanDir(apiDir, '/api');
  }

  // Scan Components
  const componentsDir = path.join(rootDir, 'src', 'presentation', 'components');
  if (fs.existsSync(componentsDir)) {
    const scanComponents = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          scanComponents(path.join(dir, item.name));
        } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
          inventory.components.push(path.relative(rootDir, path.join(dir, item.name)).replace(/\\/g, '/'));
        }
      }
    };
    scanComponents(componentsDir);
  }

  // Scan Repositories
  const repoDir = path.join(rootDir, 'src', 'infrastructure', 'firebase', 'repositories');
  if (fs.existsSync(repoDir)) {
    const files = fs.readdirSync(repoDir);
    inventory.repositories = files.map((f) => f.replace('.ts', ''));
  }

  // Scan Services
  const servicesDir = path.join(rootDir, 'src', 'core', 'application', 'services');
  if (fs.existsSync(servicesDir)) {
    const scanServices = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          scanServices(path.join(dir, item.name));
        } else if (item.name.endsWith('.ts')) {
          inventory.services.push(item.name.replace('.ts', ''));
        }
      }
    };
    scanServices(servicesDir);
  }

  const outputFile = path.join(auditDir, `inventory_${dateStr}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(inventory, null, 2), 'utf-8');
  console.log(`[ETAPA 1] Inventário Completo gerado em: ${outputFile}`);
  console.log(`Páginas: ${inventory.pages.length} | APIs: ${inventory.apiRoutes.length} | Componentes: ${inventory.components.length} | Coleções: ${inventory.firestoreCollections.length}`);
}

runInventory();
