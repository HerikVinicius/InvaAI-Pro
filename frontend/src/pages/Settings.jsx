import { useState, useEffect } from 'react';
import { User, Building2, Plug, Bot, Save, MapPin, Phone, FileText, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatCNPJ, formatPhone, unformatCNPJ, unformatPhone } from '../utils/masks';

export default function Settings() {
  const { user } = useAuthStore();
  const [autoRestock, setAutoRestock] = useState(true);
  const [anomalyOverride, setAnomalyOverride] = useState(false);
  const [sensitivity, setSensitivity] = useState(74);
  const [aggression, setAggression] = useState(35);

  // Store config
  const [storeConfig, setStoreConfig] = useState({
    storeName: '',
    cnpj: '00.000.000/0000-00',
    address: '',
    phone: '',
    email: '',
  });
  const [editingStoreConfig, setEditingStoreConfig] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // RBAC: only master/admin see the technical containers (Company info,
  // API/integrations, AI tuning). Lojista can edit store config. Vendedor: Profile only.
  const showTechnicalContainers = user?.role === 'master' || user?.role === 'admin';
  const canEditStoreConfig = ['master', 'admin', 'lojista'].includes(user?.role);

  // Carregar configuração da loja ao montar
  useEffect(() => {
    const loadStoreConfig = async () => {
      if (!canEditStoreConfig) return;
      setLoadingConfig(true);
      try {
        const res = await api.get('/tenant-config');
        const config = res.data.config;
        setStoreConfig({
          ...config,
          cnpj: formatCNPJ(config.cnpj),
          phone: formatPhone(config.phone),
        });
      } catch (err) {
        console.warn('Erro ao carregar configuração da loja:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadStoreConfig();
  }, [canEditStoreConfig]);

  const handleSaveStoreConfig = async () => {
    setSavingConfig(true);
    try {
      // Remover formatação antes de enviar
      const configToSave = {
        storeName: storeConfig.storeName,
        cnpj: unformatCNPJ(storeConfig.cnpj),
        address: storeConfig.address,
        phone: unformatPhone(storeConfig.phone),
        email: storeConfig.email,
      };

      const res = await api.put('/tenant-config', configToSave);

      // Formatar de volta para exibição
      const formattedConfig = {
        ...res.data.config,
        cnpj: formatCNPJ(res.data.config.cnpj),
        phone: formatPhone(res.data.config.phone),
      };

      setStoreConfig(formattedConfig);
      setEditingStoreConfig(false);
      toast.success('Configuração da loja salva com sucesso!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar configuração.');
      console.error('Erro:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStoreConfig(false);
    // Recarregar dados originais
    const loadStoreConfig = async () => {
      try {
        const res = await api.get('/tenant-config');
        const config = res.data.config;
        setStoreConfig({
          ...config,
          cnpj: formatCNPJ(config.cnpj),
          phone: formatPhone(config.phone),
        });
      } catch (err) {
        console.warn('Erro ao recarregar configuração:', err);
      }
    };
    loadStoreConfig();
  };

  const handleConfigChange = (field, value) => {
    // Aplicar máscara automaticamente
    let formattedValue = value;
    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    setStoreConfig(prev => ({ ...prev, [field]: formattedValue }));
  };

  const integrations = [
    { name: 'Node.js Backend', sub: 'api-v4.node-runtime.internal', status: 'CONNECTED' },
    { name: 'ERP Sync Engine', sub: 'sap-ecc.integration.sync', status: 'CONNECTED' },
    { name: 'Legacy CLI Hook', sub: 'local.host:8080/cli', status: 'DISCONNECTED' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {showTechnicalContainers
              ? 'Gerencie variáveis de ambiente globais, parâmetros de IA e protocolos de autenticação.'
              : canEditStoreConfig
              ? 'Configure as informações da sua loja para aparecer nos recibos impressos.'
              : 'Veja seu perfil. Para gerenciar vendedores, use a página Vendedores.'}
          </p>
        </div>
        {editingStoreConfig && canEditStoreConfig && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={X} onClick={handleCancelEdit}>
              Cancelar
            </Button>
            <Button icon={Save} onClick={handleSaveStoreConfig} loading={savingConfig}>
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-4 ${showTechnicalContainers ? 'lg:grid-cols-2' : ''}`}>
        {/* Profile — sempre visível */}
        <Section icon={User} title="Meu Perfil">
          <Input label="Nome de Exibição" value={user?.name || ''} readOnly />
          <Input label="Username" value={user?.username ? `@${user.username}` : ''} readOnly />
          <Input label="Função de Acesso" value={user?.role?.toUpperCase() || ''} readOnly />
        </Section>

        {/* Store Configuration — master/admin/lojista */}
        {canEditStoreConfig && (
          <Section icon={Building2} title="Configuração da Loja" badge="RECIBOS">
            {!editingStoreConfig ? (
              // Modo Visualização
              <div className="space-y-3">
                <div>
                  <p className="label-caps text-text-muted mb-1">Nome da Loja (Fantasia)</p>
                  <p className="text-sm text-text-primary">{storeConfig.storeName || '—'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="label-caps text-text-muted mb-1">CNPJ</p>
                    <p className="text-sm text-text-primary font-mono">{storeConfig.cnpj || '—'}</p>
                  </div>
                  <div>
                    <p className="label-caps text-text-muted mb-1">Telefone</p>
                    <p className="text-sm text-text-primary font-mono">{storeConfig.phone || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="label-caps text-text-muted mb-1">Endereço</p>
                  <p className="text-sm text-text-primary">{storeConfig.address || '—'}</p>
                </div>
                <div>
                  <p className="label-caps text-text-muted mb-1">Email</p>
                  <p className="text-sm text-text-primary">{storeConfig.email || '—'}</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <Button
                    icon={Edit2}
                    variant="secondary"
                    onClick={() => setEditingStoreConfig(true)}
                    className="w-full"
                  >
                    Editar Configurações
                  </Button>
                </div>
              </div>
            ) : (
              // Modo Edição
              <div className="space-y-3">
                <Input
                  label="Nome da Loja (Fantasia)"
                  value={storeConfig.storeName}
                  onChange={(e) => handleConfigChange('storeName', e.target.value)}
                  placeholder="Ex: Loja do João"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="CNPJ (apenas números)"
                    value={storeConfig.cnpj}
                    onChange={(e) => handleConfigChange('cnpj', e.target.value)}
                    placeholder="00000000000000"
                    maxLength="18"
                  />
                  <Input
                    label="Telefone (apenas números)"
                    value={storeConfig.phone}
                    onChange={(e) => handleConfigChange('phone', e.target.value)}
                    placeholder="1198765432"
                    maxLength="15"
                  />
                </div>
                <Input
                  label="Endereço"
                  value={storeConfig.address}
                  onChange={(e) => handleConfigChange('address', e.target.value)}
                  placeholder="Rua Exemplo, 123 - Bairro, Cidade"
                />
                <Input
                  label="Email"
                  value={storeConfig.email}
                  onChange={(e) => handleConfigChange('email', e.target.value)}
                  placeholder="contato@loja.com"
                />
                <p className="text-xs text-text-muted">
                  <strong>CNPJ e Telefone:</strong> Digite apenas números. A formatação é automática.
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Technical containers — só master/admin */}
        {showTechnicalContainers && (
          <>
            <Section icon={Building2} title="Informações da Empresa e Instalação">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nome da Organização" defaultValue="Global Logistics Corp" />
                <Input label="Região Geográfica" defaultValue="América do Norte - Leste (US-EAST-1)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Identificador da Instalação" defaultValue="WAREHOUSE-DELTA-9" />
                <Input label="Fuso Horário" defaultValue="UTC -05:00 Horário Padrão Oriental" readOnly />
              </div>
            </Section>

            <Section icon={Plug} title="API e Integrações" badge="3 ATIVO">
              <div className="space-y-2">
                {integrations.map((i) => (
                  <div key={i.name} className="bg-background border border-border rounded-md p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center">
                      <Plug className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{i.name}</div>
                      <div className="data-mono text-xs text-text-muted">{i.sub}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 ${i.status === 'CONNECTED' ? 'text-accent' : 'text-text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${i.status === 'CONNECTED' ? 'bg-accent' : 'bg-text-muted'}`} />
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full border border-dashed border-border mt-2">
                + Configurar Novo Webhook
              </Button>
            </Section>

            <Section icon={Bot} title="Configuração do Modelo de IA">
              <Slider label="Sensibilidade de Previsão" value={sensitivity} onChange={setSensitivity} suffix="%" hint="Ajusta o limite para alertas de 'Estoque Baixo'." />
              <Slider label="Agressividade de Reordenação Dinâmica" value={aggression} onChange={setAggression} suffix={aggression < 40 ? 'Baixa' : aggression < 70 ? 'Média' : 'Alta'} hint="Determina com que rapidez a IA sugere compras em massa." />
              <div className="grid grid-cols-2 gap-3">
                <Toggle label="Propostas de Reposição Automática" hint="Ativar ordens de compra geradas por IA para aprovação." enabled={autoRestock} onToggle={setAutoRestock} />
                <Toggle label="Sobreposições de Detecção de Anomalias" hint="Ignorar picos de fornecimento localizados em favor de tendências globais." enabled={anomalyOverride} onToggle={setAnomalyOverride} />
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] uppercase tracking-wider text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Slider({ label, value, onChange, suffix, hint }) {
  const isPercent = typeof suffix === 'string' && suffix.length <= 1;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="text-[10px] uppercase tracking-wider text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
          {isPercent ? `${value}${suffix || ''}` : suffix}
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-2">{hint}</p>
      <input
        type="range" min="0" max="100" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

function Toggle({ label, hint, enabled, onToggle }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs font-semibold flex-1">{label}</span>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-accent' : 'bg-surface-elevated border border-border'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <p className="text-xs text-text-secondary">{hint}</p>
    </div>
  );
}
