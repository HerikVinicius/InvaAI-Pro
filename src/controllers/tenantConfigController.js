const TenantConfig = require('../models/TenantConfig');
const { success, error } = require('../utils/apiResponse');

const getTenantConfig = async (req, res) => {
  try {
    const TenantTenantConfig = req.db.model('TenantConfig', TenantConfig.schema);

    // Buscar configuração do tenant. Se não existir, criar com valores padrão.
    let config = await TenantTenantConfig.findOne();

    if (!config) {
      config = await TenantTenantConfig.create({
        storeName: '',
        cnpj: '00.000.000/0000-00',
        address: '',
        phone: '',
        email: '',
      });
    }

    return success(res, { config });
  } catch (err) {
    console.error('[TenantConfigController] getTenantConfig error:', err.message);
    return error(res, 'Falha ao buscar configuração do tenant.', 500);
  }
};

const updateTenantConfig = async (req, res) => {
  try {
    // Permitir: admin, master E lojista
    // Vendedor/Gerente: acesso negado
    if (!['admin', 'master', 'lojista'].includes(req.user.role)) {
      return error(res, 'Acesso negado. Você não tem permissão para editar configurações da loja.', 403);
    }

    const { storeName, cnpj, address, phone, email } = req.body;

    const TenantTenantConfig = req.db.model('TenantConfig', TenantConfig.schema);

    // Buscar configuração existente
    let config = await TenantTenantConfig.findOne();

    if (!config) {
      // Se não existe, criar
      config = await TenantTenantConfig.create({
        storeName: storeName || '',
        cnpj: cnpj || '00.000.000/0000-00',
        address: address || '',
        phone: phone || '',
        email: email || '',
      });
    } else {
      // Atualizar campos fornecidos
      if (storeName !== undefined) config.storeName = storeName;
      if (cnpj !== undefined) config.cnpj = cnpj;
      if (address !== undefined) config.address = address;
      if (phone !== undefined) config.phone = phone;
      if (email !== undefined) config.email = email;

      await config.save();
    }

    return success(res, { config });
  } catch (err) {
    console.error('[TenantConfigController] updateTenantConfig error:', err.message);
    return error(res, err.message || 'Falha ao atualizar configuração.', 500);
  }
};

module.exports = { getTenantConfig, updateTenantConfig };
