require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Força Google DNS
const express = require('express');
const cors = require('cors');
const { connectAdminDB } = require('./utils/connectionManager');
const { migrateUsersEmailToUsername } = require('./utils/migrateUsersEmailToUsername');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const vendedoresRoutes = require('./routes/vendedoresRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const salesRoutes = require('./routes/salesRoutes');
const usersRoutes = require('./routes/usersRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const tenantsRoutes = require('./routes/tenantsRoutes');
const caixaRoutes = require('./routes/caixaRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const tenantConfigRoutes = require('./routes/tenantConfigRoutes');
const aiInsightsRoutes = require('./routes/aiInsightsRoutes');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/tenant-config', tenantConfigRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', system: 'InvaAI Pro', timestamp: new Date().toISOString() }));

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Bootstrap ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  if (process.env.NODE_ENV === 'production') {
    await connectAdminDB();
    await migrateUsersEmailToUsername();
  } else {
    // Dev: conecta em background, não bloqueia startup. Migration roda quando conectar.
    connectAdminDB()
      .then(() => migrateUsersEmailToUsername())
      .catch(err => console.warn('[DB] Connection failed (dev mode):', err.message));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] InvaAI Pro running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();
