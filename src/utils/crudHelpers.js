const { success, error } = require('./apiResponse');

/**
 * Wrapper assíncrono que trata erros automaticamente
 * Centraliza try-catch em todos os controllers
 *
 * @param {Function} handler - função assíncrona do controller
 * @param {string} context - nome do controller para logs
 * @returns {Function} middleware que chama o handler e trata erros
 *
 * @example
 * const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) throw { statusCode: 404, message: 'Usuário não encontrado.' };
 *   return success(res, { user });
 * }, 'UsersController');
 */
function asyncHandler(handler, context = 'Controller') {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error.';

      if (statusCode >= 500) {
        console.error(`[${context}] Server error:`, err);
      } else if (statusCode >= 400) {
        console.warn(`[${context}] Client error (${statusCode}):`, message);
      }

      return error(res, message, statusCode);
    }
  };
}

/**
 * Simplifica o padrão "find or throw error"
 * Evita if (!doc) return error(...) repetido
 *
 * @param {Model} Model - Mongoose model ou classe com findById
 * @param {string} id - documento ID
 * @param {Object} options
 *   - message: mensagem de erro customizada
 *   - notFoundCode: status code (default: 404)
 * @returns {Promise<Document>} documento encontrado
 * @throws {Object} { statusCode, message } se não encontrado
 *
 * @example
 * const user = await findOrError(User, req.params.id, {
 *   message: 'Usuário não encontrado.'
 * });
 */
async function findOrError(Model, id, options = {}) {
  const { message = 'Recurso não encontrado.', notFoundCode = 404 } = options;

  const doc = await Model.findById(id);
  if (!doc) {
    throw { statusCode: notFoundCode, message };
  }

  return doc;
}

/**
 * Atualiza apenas campos definidos no payload (PATCH logic)
 * Evita sobrescrever campos não enviados
 *
 * @param {Document} doc - documento MongoDB/modelo
 * @param {Object} payload - dados do request body
 * @param {Array<string>} allowedFields - campos que podem ser atualizados
 * @returns {Document} documento com atualizações
 *
 * @example
 * const user = await User.findById(id);
 * patchDocument(user, req.body, ['name', 'email', 'phone']);
 * await user.save();
 */
function patchDocument(doc, payload, allowedFields) {
  for (const field of allowedFields) {
    if (field in payload && payload[field] !== undefined) {
      doc[field] = payload[field];
    }
  }
  return doc;
}

/**
 * Validação genérica de campos obrigatórios
 *
 * @param {Object} data - objeto com dados
 * @param {Array<string>} requiredFields - campos que devem estar presentes
 * @returns {Object|null} { field, message } se inválido, null se valid
 *
 * @example
 * const validation = requireFields({ name: '', email: 'test@ex.com' }, ['name', 'email']);
 * if (validation) throw { statusCode: 400, message: validation.message };
 */
function requireFields(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return {
        field,
        message: `${field} é obrigatório.`,
      };
    }
  }
  return null;
}

/**
 * Normaliza dados comuns antes de salvar
 * (trim strings, lowercase, etc)
 *
 * @param {Object} payload - dados do request
 * @param {Array<string>} trimFields - campos para fazer trim
 * @param {Array<string>} lowerFields - campos para lowercase
 * @returns {Object} payload normalizado
 *
 * @example
 * const data = normalizePayload(
 *   req.body,
 *   ['name', 'email'],
 *   ['email', 'username']
 * );
 */
function normalizePayload(payload, trimFields = [], lowerFields = []) {
  const normalized = { ...payload };

  for (const field of trimFields) {
    if (normalized[field] && typeof normalized[field] === 'string') {
      normalized[field] = normalized[field].trim();
    }
  }

  for (const field of lowerFields) {
    if (normalized[field] && typeof normalized[field] === 'string') {
      normalized[field] = normalized[field].toLowerCase();
    }
  }

  return normalized;
}

/**
 * Pagina resultados de forma segura
 * Previne page/limit abusivos
 *
 * @param {number} page - número da página (1-indexed)
 * @param {number} limit - itens por página
 * @param {Object} options
 *   - minPage: página mínima (default: 1)
 *   - maxLimit: limite máximo (default: 100)
 *   - defaultLimit: limite padrão (default: 10)
 * @returns {Object} { skip, limit, page }
 *
 * @example
 * const { skip, limit, page } = safePagination(req.query.page, req.query.limit);
 * const items = await Model.find(filter).skip(skip).limit(limit);
 */
function safePagination(page, limit, options = {}) {
  const { minPage = 1, maxLimit = 100, defaultLimit = 10 } = options;

  const pageNum = Math.max(minPage, parseInt(page) || minPage);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || defaultLimit));
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
}

/**
 * Build filter de busca com regex seguro
 * Escapa caracteres especiais de regex
 *
 * @param {string} query - string de busca
 * @param {Array<string>} fields - campos para buscar
 * @returns {Object} MongoDB filter { $or: [...] }
 *
 * @example
 * const filter = buildSearchFilter('john', ['name', 'email', 'username']);
 * // { $or: [
 * //   { name: /john/i },
 * //   { email: /john/i },
 * //   { username: /john/i }
 * // ]}
 */
function buildSearchFilter(query, fields) {
  if (!query || !query.trim()) return {};

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

module.exports = {
  asyncHandler,
  findOrError,
  patchDocument,
  requireFields,
  normalizePayload,
  safePagination,
  buildSearchFilter,
};
