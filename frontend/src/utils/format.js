/**
 * Utilitários de formatação compartilhados
 * Centraliza lógica de formatação para garantir consistência
 */

export const format = {
  // Moeda brasileira
  currency: (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0),

  // Data em pt-BR (DD/MM/YYYY)
  date: (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  },

  // Data + hora (DD/MM/YYYY HH:MM)
  dateTime: (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  },

  // Percentual (10.5%)
  percent: (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    return `${(value || 0).toFixed(decimals)}%`;
  },

  // Telefone (00) 00000-0000
  phone: (phone) => {
    if (!phone) return '-';
    const digits = phone.toString().replace(/\D/g, '');
    if (digits.length !== 11) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  },

  // CPF 000.000.000-00
  cpf: (cpf) => {
    if (!cpf) return '-';
    const digits = cpf.toString().replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  },

  // Quantidade (int)
  quantity: (qty) => {
    if (qty === null || qty === undefined) return '0';
    return Math.floor(qty).toString();
  },

  // Número com decimal (0.00)
  decimal: (value, decimals = 2) => {
    if (value === null || value === undefined) return '0.00';
    return (value || 0).toFixed(decimals);
  },

  // Horas:Minutos
  time: (date) => {
    if (!date) return '--:--';
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // Status com emoji
  status: (status) => {
    const statuses = {
      active: '✓ Ativo',
      inactive: '✗ Inativo',
      pending: '⏳ Pendente',
      completed: '✓ Completo',
      failed: '✗ Falhou',
    };
    return statuses[status] || status;
  },
};

// Aliases curtos para uso frequente (backward compatible)
export const fmt = format.currency;
export const fmtDate = format.date;
export const fmtTime = format.time;
export const fmtPercent = format.percent;
export const fmtPhone = format.phone;
export const fmtQty = format.quantity;
