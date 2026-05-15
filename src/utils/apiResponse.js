const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

// Accepts either a plain string message, or an object with { message, code, ...extra }
// so the frontend can branch on machine-readable error codes (e.g. CAIXA_EXPIRED).
const error = (res, payload, statusCode = 500) => {
  if (payload && typeof payload === 'object') {
    return res.status(statusCode).json({ success: false, ...payload });
  }
  return res.status(statusCode).json({ success: false, message: payload });
};

module.exports = { success, error };
