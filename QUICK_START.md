# ⚡ Quick Start: Importação de NF-e XML

## 1️⃣ Iniciar o servidor

```powershell
cd "c:\Users\Herik Vinicius\Documents\ProjetoSaas"
node src/server.js
```

Você deve ver:
```
✓ Server running on http://localhost:5000
✓ Database connected
```

## 2️⃣ Iniciar o frontend

Em outro terminal PowerShell:

```powershell
cd "c:\Users\Herik Vinicius\Documents\ProjetoSaas\frontend"
npm run dev
```

Acesse: **http://192.168.137.1:5173**

## 3️⃣ Testar a importação

### Usando arquivo de teste:

1. Clique no botão **"Importar"** (lado direito)
2. Clique na área de drag-and-drop ou selecione arquivo
3. Escolha **`test-nfe.xml`** da raiz do projeto
4. Clique **"Processar XML"**
5. Verifique a tabela com 2 produtos:
   - `B0876XRYGT` - MULTIPROCESSADOR COMPACTO BMP900P (R$ 133.00)
   - `05010103937009` - Vodka Ciroc 750ml (R$ 209.90)
6. Clique **"Confirmar Importação"**
7. Pronto! Os produtos foram adicionados ao estoque

---

## 📊 Resultado esperado

Após importação bem-sucedida:
- ✅ 2 produtos criados
- ✅ 0 atualizados
- ✅ 0 erros

---

## 🧪 Testando com arquivo XML real

Se tiver um XML real de NF-e:
1. Coloque na pasta `C:\Users\Herik Vinicius\Documents\`
2. Faça upload normalmente
3. O sistema extrairá todos os produtos

---

## 🔍 Verificar que funcionou

Após a importação:
1. Veja o resumo na modal: "Foram importados X produtos"
2. Vuelva à página de Estoque
3. Os produtos devem aparecer na tabela com preço e quantidade

---

## ❌ Se algo não funcionar

### Servidor não inicia?
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
→ MongoDB não está rodando. Instale/inicie o MongoDB.

### Frontend não carrega?
```
Error: EADDRINUSE: address already in use :::5173
```
→ Porta já em uso. Mate a outra sessão: `lsof -i :5173 | kill -9`

### Importação retorna erro 422?
→ Arquivo não é XML válido. Verifique se é um NF-e completo (não DANFE).

---

## 📝 Próximos passos

- [ ] Testar com mais arquivos XML reais
- [ ] Validar atualizações de estoque (segunda importação do mesmo SKU)
- [ ] Implementar interface para rejeitar produtos específicos
- [ ] Adicionar suporte a múltiplos XMLs na mesma importação

---

**Tempo estimado para testar:** 5 minutos
