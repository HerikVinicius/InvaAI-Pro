// MongoDB Initialization Script
// Executado automaticamente quando o container MongoDB é iniciado

db = db.getSiblingDB('invaai_prod');

// Criar coleções iniciais
db.createCollection('users');
db.createCollection('products');
db.createCollection('sales');
db.createCollection('clients');
db.createCollection('caixa');
db.createCollection('tenants');

// Criar índices para melhor performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ tenantId: 1 });
db.users.createIndex({ createdAt: -1 });

db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ tenantId: 1 });
db.products.createIndex({ name: "text", category: "text" });
db.products.createIndex({ createdAt: -1 });

db.sales.createIndex({ tenantId: 1 });
db.sales.createIndex({ vendorId: 1 });
db.sales.createIndex({ createdAt: -1 });
db.sales.createIndex({ clientId: 1 });

db.clients.createIndex({ email: 1 }, { unique: true });
db.clients.createIndex({ tenantId: 1 });
db.clients.createIndex({ createdAt: -1 });

db.caixa.createIndex({ tenantId: 1 });
db.caixa.createIndex({ openedAt: -1 });
db.caixa.createIndex({ closedAt: -1 });

db.tenants.createIndex({ name: 1 }, { unique: true });
db.tenants.createIndex({ createdAt: -1 });

print('✅ MongoDB initialized successfully');
print('Database: invaai_prod');
print('Collections created: users, products, sales, clients, caixa, tenants');
print('Indexes created for performance optimization');
