require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const { connectAdminDB, getTenantConnection } = require('./connectionManager');

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Salesperson = require('../models/Salesperson');
const MonthlySales = require('../models/MonthlySales');
const User = require('../models/User');

/**
 * Limpa dados de venda/estoque do tenant, mantendo apenas o produto e vendedor "teste".
 * Zera o salesRealized do vendedor teste para começar do zero.
 */
const cleanTenant = async (tenantId) => {
  const conn = getTenantConnection(tenantId);
  await new Promise((resolve, reject) => {
    if (conn.readyState === 1) return resolve();
    conn.once('connected', resolve);
    conn.once('error', reject);
  });

  const TenantSale = conn.model('Sale', Sale.schema);
  const TenantProduct = conn.model('Product', Product.schema);
  const TenantSalesperson = conn.model('Salesperson', Salesperson.schema);
  const TenantMonthlySales = conn.model('MonthlySales', MonthlySales.schema);

  console.log(`\n=== Limpando tenant: ${tenantId} ===`);

  const salesDeleted = await TenantSale.deleteMany({});
  console.log(`✓ ${salesDeleted.deletedCount} venda(s) deletada(s)`);

  const monthlyDeleted = await TenantMonthlySales.deleteMany({});
  console.log(`✓ ${monthlyDeleted.deletedCount} registro(s) de vendas mensais deletado(s)`);

  const produtosKeep = await TenantProduct.find({ name: /teste/i });
  const produtosDeleted = await TenantProduct.deleteMany({ name: { $not: /teste/i } });
  console.log(`✓ ${produtosDeleted.deletedCount} produto(s) deletado(s) (mantidos: ${produtosKeep.length})`);

  const vendedoresKeep = await TenantSalesperson.find({ name: /teste/i });
  const vendedoresDeleted = await TenantSalesperson.deleteMany({ name: { $not: /teste/i } });
  console.log(`✓ ${vendedoresDeleted.deletedCount} vendedor(es) deletado(s) (mantidos: ${vendedoresKeep.length})`);

  const reset = await TenantSalesperson.updateMany({}, { $set: { salesRealized: 0 } });
  console.log(`✓ salesRealized resetado em ${reset.modifiedCount} vendedor(es)`);

  await conn.close();
};

const run = async () => {
  try {
    await connectAdminDB();

    const adminConn = mongoose.connection;
    const dbs = await adminConn.db.admin().listDatabases();
    const tenantDbs = dbs.databases
      .filter((d) => d.name.startsWith('invaai_') && d.name !== 'invaai_admin')
      .map((d) => d.name.replace('invaai_', ''));

    if (tenantDbs.length === 0) {
      console.log('Nenhum tenant encontrado.');
    } else {
      console.log(`Tenants encontrados: ${tenantDbs.join(', ')}`);
      for (const tenantId of tenantDbs) {
        await cleanTenant(tenantId);
      }
    }

    console.log('\n✓ Cleanup concluído com sucesso!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = { cleanTenant };
