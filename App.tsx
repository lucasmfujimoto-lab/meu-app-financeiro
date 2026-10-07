import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { styles } from './styles';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  // Navegação de Telas ("dashboard" | "investimentos")
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'investimentos'>('dashboard');

  // Dados do banco de dados local (IndexedDB)
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const cards = useLiveQuery(() => db.cards.toArray()) || [];
  const savings = useLiveQuery(() => db.savings.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const investments = useLiveQuery(() => db.investments.toArray()) || [];

  // Categorias personalizadas
  const [customCategories, setCustomCategories] = useState<string[]>([
    'Salário', 'Investimento', 'Mercado', 'Shopping', 'Uber', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros'
  ]);

  // Filtros da Dashboard
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filterBank, setFilterBank] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Filtros da Tela de Investimentos
  const [invFilterBank, setInvFilterBank] = useState('');
  const [invFilterType, setInvFilterType] = useState('');

  // Modais
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);

  // Estados de Edição
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [editingAccId, setEditingAccId] = useState<number | null>(null);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingInvestId, setEditingInvestId] = useState<number | null>(null);

  // Formulários de Bancos e Cartões
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');
  
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosing, setCardClosing] = useState('20');
  const [cardDue, setCardDue] = useState('27');
  const [cardBankId, setCardBankId] = useState('');

  // Formulário de Transações
  const [txDesc, setTxDesc] = useState('');
  const [txDetails, setTxDetails] = useState('');
  const [txFlow, setTxFlow] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [txType, setTxType] = useState<'DEBITO' | 'PIX' | 'CREDITO'>('DEBITO');
  const [txCategory, setTxCategory] = useState('Mercado');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(today);
  const [txAccId, setTxAccId] = useState('');
  const [txCardId, setTxCardId] = useState('');
  const [txInstallments, setTxInstallments] = useState(1);

  const [newCatName, setNewCatName] = useState('');

  // Formulário de Investimentos
  const [invType, setInvType] = useState<'AÇÕES' | 'FII' | 'RENDA_FIXA' | 'OUTROS'>('AÇÕES');
  const [invTicker, setInvTicker] = useState('');
  const [invBankId, setInvBankId] = useState('');
  const [invTotalValue, setInvTotalValue] = useState('');
  const [invQuantity, setInvQuantity] = useState('1');

  // Totais Globais
  const totalBalance = accounts.reduce((acc, cur) => acc + cur.currentBalance, 0);
  const totalSavings = savings.reduce((acc, cur) => acc + cur.currentAmount, 0);
  const totalInvested = investments.reduce((acc, cur) => acc + (cur.quantity * cur.currentValue), 0);
  const totalPatrimony = totalBalance + totalSavings + totalInvested;

  // Lançamentos Filtrados
  const filteredTransactions = transactions.filter(t => {
    const matchMonth = t.date.startsWith(selectedMonth);
    const matchBank = filterBank ? (t.bankAccountId === Number(filterBank) || t.creditCardId === Number(filterBank)) : true;
    const matchType = filterType ? t.type === filterType : true;
    const matchCategory = filterCategory ? t.category === filterCategory : true;
    return matchMonth && matchBank && matchType && matchCategory;
  });

  const monthEntradas = filteredTransactions.filter(t => (t as any).flow === 'ENTRADA').reduce((acc, cur) => acc + cur.amount, 0);
  const monthSaidas = filteredTransactions.filter(t => (t as any).flow !== 'ENTRADA').reduce((acc, cur) => acc + cur.amount, 0);

  // Investimentos Filtrados
  const filteredInvestments = investments.filter(inv => {
    const matchBank = invFilterBank ? (inv as any).bankAccountId === Number(invFilterBank) : true;
    const matchType = invFilterType ? inv.type === invFilterType : true;
    return matchBank && matchType;
  });

  const filteredInvestedTotal = filteredInvestments.reduce((acc, cur) => acc + (cur.quantity * cur.currentValue), 0);

  // --- GERENCIAMENTO DE BANCOS ---
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(accBalance) || 0;
    if (editingAccId) {
      await db.accounts.update(editingAccId, { name: accName, currentBalance: balanceNum });
      setEditingAccId(null);
    } else {
      await db.accounts.add({ name: accName, color: '#3b82f6', currentBalance: balanceNum });
    }
    setAccName(''); setAccBalance(''); setShowAccountModal(false);
  };

  const handleEditAccount = (acc: any) => {
    setEditingAccId(acc.id);
    setAccName(acc.name);
    setAccBalance(acc.currentBalance.toString());
    setShowAccountModal(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (window.confirm('Tem certeza que deseja apagar esta conta bancária?')) {
      await db.accounts.delete(id);
    }
  };

  // --- GERENCIAMENTO DE CARTÕES DE CRÉDITO ---
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(cardLimit) || 0;
    if (editingCardId) {
      await db.cards.update(editingCardId, {
        name: cardName,
        bankAccountId: Number(cardBankId),
        limitAmount: limitNum,
        closingDay: Number(cardClosing),
        dueDay: Number(cardDue)
      });
      setEditingCardId(null);
    } else {
      await db.cards.add({
        name: cardName,
        bankAccountId: Number(cardBankId),
        limitAmount: limitNum,
        closingDay: Number(cardClosing),
        dueDay: Number(cardDue)
      });
    }
    setCardName(''); setCardLimit(''); setShowCardModal(false);
  };

  const handleEditCard = (c: any) => {
    setEditingCardId(c.id);
    setCardName(c.name);
    setCardLimit(c.limitAmount.toString());
    setCardClosing(c.closingDay.toString());
    setCardDue(c.dueDay.toString());
    setCardBankId(c.bankAccountId ? c.bankAccountId.toString() : '');
    setShowCardModal(true);
  };

  const handleDeleteCard = async (id: number) => {
    if (window.confirm('Tem certeza que deseja apagar este cartão de crédito?')) {
      await db.cards.delete(id);
    }
  };

  // --- GERENCIAMENTO DE TRANSAÇÕES ---
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txAmount);
    if (!val) return;

    if (editingTxId) {
      await db.transactions.update(editingTxId, {
        description: txDesc,
        details: txDetails,
        flow: txFlow,
        type: txType,
        category: txCategory,
        amount: val,
        date: txDate,
        bankAccountId: txAccId ? Number(txAccId) : undefined,
        creditCardId: txCardId ? Number(txCardId) : undefined
      } as any);
      setEditingTxId(null);
    } else {
      const txId = await db.transactions.add({
        description: txDesc,
        details: txDetails,
        flow: txFlow,
        type: txType,
        category: txCategory,
        amount: val,
        date: txDate,
        bankAccountId: txAccId ? Number(txAccId) : undefined,
        creditCardId: txCardId ? Number(txCardId) : undefined,
        installmentsCount: txType === 'CREDITO' ? Number(txInstallments) : 1
      } as any);

      if ((txType === 'DEBITO' || txType === 'PIX') && txAccId) {
        const acc = await db.accounts.get(Number(txAccId));
        if (acc) {
          const newBalance = txFlow === 'ENTRADA' ? acc.currentBalance + val : acc.currentBalance - val;
          await db.accounts.update(Number(txAccId), { currentBalance: newBalance });
        }
      }

      if (txType === 'CREDITO' && txCardId) {
        const card = await db.cards.get(Number(txCardId));
        if (card) {
          const newLimit = txFlow === 'ENTRADA' ? card.limitAmount + val : Math.max(0, card.limitAmount - val);
          await db.cards.update(Number(txCardId), { limitAmount: newLimit });

          if (txFlow === 'SAIDA') {
            const parts = Number(txInstallments);
            const partVal = val / parts;
            const [y, m, d] = txDate.split('-').map(Number);
            let startMonth = m - 1;
            if (d >= card.closingDay) startMonth += 1;

            for (let i = 0; i < parts; i++) {
              const dt = new Date(y, startMonth + i, 1);
              const monthStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
              await db.installments.add({
                transactionId: txId as number,
                installmentNumber: i + 1,
                amount: partVal,
                billingMonth: monthStr,
                creditCardId: Number(txCardId),
                status: 'PENDENTE'
              });
            }
          }
        }
      }
    }

    setTxDesc(''); setTxDetails(''); setTxAmount(''); setShowTxModal(false);
  };

  const handleEditTransaction = (t: any) => {
    setEditingTxId(t.id);
    setTxDesc(t.description);
    setTxDetails(t.details || '');
    setTxFlow(t.flow || 'SAIDA');
    setTxType(t.type);
    setTxCategory(t.category);
    setTxAmount(t.amount.toString());
    setTxDate(t.date);
    setTxAccId(t.bankAccountId ? t.bankAccountId.toString() : '');
    setTxCardId(t.creditCardId ? t.creditCardId.toString() : '');
    setShowTxModal(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza de que deseja apagar este lançamento?')) {
      await db.transactions.delete(id);
      setShowTxModal(false);
    }
  };

  // --- GERENCIAMENTO DE CATEGORIAS ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName && !customCategories.includes(newCatName)) {
      setCustomCategories([...customCategories, newCatName]);
      setNewCatName('');
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Deseja apagar a categoria "${catToDelete}"?`)) {
      setCustomCategories(customCategories.filter(c => c !== catToDelete));
    }
  };

  // --- GERENCIAMENTO DE INVESTIMENTOS ---
  const handleSaveInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const totVal = parseFloat(invTotalValue) || 0;
    const isCofrinho = invType === 'OUTROS';
    const qty = isCofrinho ? 1 : (parseFloat(invQuantity) || 1);
    const avgPrice = totVal / qty;

    if (editingInvestId) {
      await db.investments.update(editingInvestId, {
        ticker: invTicker,
        type: invType,
        quantity: qty,
        averagePrice: avgPrice,
        currentValue: avgPrice,
        bankAccountId: invBankId ? Number(invBankId) : undefined
      } as any);
      setEditingInvestId(null);
    } else {
      await db.investments.add({
        ticker: invTicker,
        type: invType,
        quantity: qty,
        averagePrice: avgPrice,
        currentValue: avgPrice,
        bankAccountId: invBankId ? Number(invBankId) : undefined
      } as any);
    }

    setInvTicker(''); setInvTotalValue(''); setInvQuantity('1'); setShowInvestModal(false);
  };

  const handleEditInvestment = (inv: any) => {
    setEditingInvestId(inv.id);
    setInvTicker(inv.ticker);
    setInvType(inv.type);
    setInvBankId(inv.bankAccountId ? inv.bankAccountId.toString() : '');
    setInvTotalValue((inv.quantity * inv.currentValue).toString());
    setInvQuantity(inv.quantity.toString());
    setShowInvestModal(true);
  };

  const handleDeleteInvestment = async (id: number) => {
    if (window.confirm('Tem certeza que deseja apagar este investimento/caixinha?')) {
      await db.investments.delete(id);
      setShowInvestModal(false);
    }
  };

  // Exportar Excel
  const exportExcel = () => {
    const data = filteredTransactions.map(t => {
      const bank = accounts.find(a => a.id === t.bankAccountId)?.name || cards.find(c => c.id === t.creditCardId)?.name || 'N/A';
      return {
        Data: t.date,
        Banco: bank,
        Fluxo: (t as any).flow || 'SAIDA',
        Descrição: t.description,
        Detalhes: t.details || '-',
        Tipo: t.type,
        Categoria: t.category,
        'Valor (R$)': t.amount
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
    XLSX.writeFile(wb, `Relatorio_Financeiro_${selectedMonth}.xlsx`);
  };

  // Exportar PDF Dashboard
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório Financeiro - ${selectedMonth}`, 14, 20);
    const rows = filteredTransactions.map(t => {
      const bank = accounts.find(a => a.id === t.bankAccountId)?.name || cards.find(c => c.id === t.creditCardId)?.name || 'N/A';
      return [t.date, bank, (t as any).flow || 'SAIDA', t.description, t.category, `R$ ${t.amount.toFixed(2)}`];
    });
    autoTable(doc, {
      startY: 30,
      head: [['Data', 'Banco', 'Fluxo', 'Descrição', 'Categoria', 'Valor']],
      body: rows,
    });
    doc.save(`Relatorio_${selectedMonth}.pdf`);
  };

  // Exportar PDF Investimentos
  const exportInvestmentsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório de Investimentos e Caixinhas`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total Investido: R$ ${filteredInvestedTotal.toFixed(2)}`, 14, 28);

    const rows = filteredInvestments.map(inv => {
      const bank = accounts.find(a => a.id === (inv as any).bankAccountId)?.name || 'N/A';
      const tot = inv.quantity * inv.currentValue;
      return [inv.ticker, inv.type, bank, inv.type === 'OUTROS' ? '-' : inv.quantity.toString(), `R$ ${tot.toFixed(2)}`];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Nome / Ticker', 'Tipo', 'Banco Custodiante', 'Cotas', 'Valor Total']],
      body: rows,
    });
    doc.save(`Relatorio_Investimentos.pdf`);
  };

  return (
    <div style={styles.container}>
      
      {/* Cabeçalho Principal */}
      <header style={styles.header}>
        <h2>💰 Gerenciador Financeiro Personalizado</h2>
        <div>
          <button onClick={exportExcel} style={styles.btnExcel}>📊 Baixar Excel</button>
          <button onClick={exportPDF} style={styles.btnPdf}>📄 Baixar PDF</button>
        </div>
      </header>

      {/* Navegação entre Telas */}
      <div style={styles.navTabs}>
        <button onClick={() => setCurrentScreen('dashboard')} style={styles.tabBtn(currentScreen === 'dashboard')}>
          🏠 Dashboard
        </button>
        <button onClick={() => setCurrentScreen('investimentos')} style={styles.tabBtn(currentScreen === 'investimentos')}>
          📈 Investimentos & Caixinhas
        </button>
      </div>

      {/* TELA 1: DASHBOARD */}
      {currentScreen === 'dashboard' && (
        <>
          {/* Cartões de Resumo */}
          <div style={styles.summaryGrid}>
            <div style={styles.card}>
              <small style={{ color: '#64748b' }}>Património Total</small>
              <h3 style={{ color: '#1e293b', margin: '8px 0 0' }}>R$ {totalPatrimony.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={styles.card}>
              <small style={{ color: '#64748b' }}>Saldo em Contas</small>
              <h3 style={{ color: '#16a34a', margin: '8px 0 0' }}>R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={styles.card}>
              <small style={{ color: '#64748b' }}>Total Investido</small>
              <h3 style={{ color: '#2563eb', margin: '8px 0 0' }}>R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={styles.card}>
              <small style={{ color: '#64748b' }}>Entradas (Mês)</small>
              <h3 style={{ color: '#16a34a', margin: '8px 0 0' }}>+ R$ {monthEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={styles.card}>
              <small style={{ color: '#64748b' }}>Saídas (Mês)</small>
              <h3 style={{ color: '#dc2626', margin: '8px 0 0' }}>- R$ {monthSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          {/* Barra de Ações */}
          <div style={styles.actionsBar}>
            <button onClick={() => { setEditingTxId(null); setShowTxModal(true); }} style={styles.btnPrimary}>+ Novo Lançamento</button>
            <button onClick={() => { setEditingAccId(null); setShowAccountModal(true); }} style={styles.btnSecondary}>+ Cadastrar Conta/Banco</button>
            <button onClick={() => { setEditingCardId(null); setShowCardModal(true); }} style={styles.btnSecondary}>+ Cadastrar Cartão</button>
            <button onClick={() => setShowCategoryModal(true)} style={styles.btnSecondary}>⚙️ Gerenciar Categorias</button>
          </div>

          {/* Listas de Contas e Cartões */}
          <div style={styles.twoColumns}>
            <div style={styles.card}>
              <h3>Bancos / Contas Cadastradas</h3>
              {accounts.length === 0 ? <p style={{ color: '#94a3b8' }}>Nenhuma conta cadastrada.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {accounts.map(a => (
                    <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span>{a.name}</span>
                      <div>
                        <strong style={{ marginRight: '10px' }}>R$ {a.currentBalance.toFixed(2)}</strong>
                        <button onClick={() => handleEditAccount(a)} style={{ padding: '2px 8px', fontSize: '12px', marginRight: '4px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => handleDeleteAccount(a.id!)} style={{ padding: '2px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.card}>
              <h3>Cartões de Crédito</h3>
              {cards.length === 0 ? <p style={{ color: '#94a3b8' }}>Nenhum cartão cadastrado.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {cards.map(c => (
                    <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <strong>{c.name}</strong>
                        <br /><small style={{ color: '#64748b' }}>Fecha dia {c.closingDay} | Vence dia {c.dueDay}</small>
                      </div>
                      <div>
                        <span style={{ marginRight: '10px' }}>Limite: <strong>R$ {c.limitAmount.toFixed(2)}</strong></span>
                        <button onClick={() => handleEditCard(c)} style={{ padding: '2px 8px', fontSize: '12px', marginRight: '4px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => handleDeleteCard(c.id!)} style={{ padding: '2px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Histórico com Filtros */}
          <div style={styles.card}>
            <h3>Histórico de Lançamentos</h3>
            
            <div style={styles.filtersRow}>
              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Mês:</label>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '6px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Banco / Cartão:</label>
                <select value={filterBank} onChange={e => setFilterBank(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">Todos os Bancos</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name} (Cartão)</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Tipo:</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">Todos os Tipos</option>
                  <option value="DEBITO">Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Categoria:</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">Todas as Categorias</option>
                  {customCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Banco</th>
                  <th style={{ padding: '10px' }}>Fluxo</th>
                  <th style={{ padding: '10px' }}>Descrição</th>
                  <th style={{ padding: '10px' }}>Categoria</th>
                  <th style={{ padding: '10px' }}>Tipo</th>
                  <th style={{ padding: '10px' }}>Valor</th>
                  <th style={{ padding: '10px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => {
                  const bankName = accounts.find(a => a.id === t.bankAccountId)?.name || cards.find(c => c.id === t.creditCardId)?.name || 'N/A';
                  const flow = (t as any).flow || 'SAIDA';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{t.date}</td>
                      <td style={{ padding: '10px' }}><strong>{bankName}</strong></td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: flow === 'ENTRADA' ? '#dcfce7' : '#fee2e2',
                          color: flow === 'ENTRADA' ? '#15803d' : '#b91c1c'
                        }}>
                          {flow}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <strong>{t.description}</strong>
                        {t.details && <><br /><small style={{ color: '#64748b' }}>{t.details}</small></>}
                      </td>
                      <td style={{ padding: '10px' }}>{t.category}</td>
                      <td style={{ padding: '10px' }}>{t.type}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: flow === 'ENTRADA' ? '#16a34a' : '#dc2626' }}>
                        {flow === 'ENTRADA' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => handleEditTransaction(t)} style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => handleDeleteTransaction(t.id!)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TELA 2: INVESTIMENTOS E CAIXINHAS */}
      {currentScreen === 'investimentos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>📈 Carteira de Investimentos e Caixinhas</h3>
              <p style={{ margin: '4px 0 0', color: '#2563eb', fontWeight: 'bold' }}>Total Investido Filtrado: R$ {filteredInvestedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <button onClick={exportInvestmentsPDF} style={{ ...styles.btnPdf, marginRight: '8px' }}>📄 PDF Investimentos</button>
              <button onClick={() => { setEditingInvestId(null); setShowInvestModal(true); }} style={styles.btnPrimary}>+ Novo Investimento / Caixinha</button>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ ...styles.card, marginBottom: '16px' }}>
            <div style={styles.filtersRow}>
              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Filtrar por Banco Custodiante:</label>
                <select value={invFilterBank} onChange={e => setInvFilterBank(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">Todos os Bancos</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Filtrar por Tipo:</label>
                <select value={invFilterType} onChange={e => setInvFilterType(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">Todos os Tipos</option>
                  <option value="AÇÕES">Ação</option>
                  <option value="FII">FII</option>
                  <option value="RENDA_FIXA">Tesouro Direto / Renda Fixa</option>
                  <option value="OUTROS">Caixinha / Cofrinho / Outros</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Investimentos com Botões de Editar e Excluir */}
          <div style={styles.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>Nome / Ticker</th>
                  <th style={{ padding: '10px' }}>Tipo</th>
                  <th style={{ padding: '10px' }}>Banco Custodiante</th>
                  <th style={{ padding: '10px' }}>Qtd. Cotas</th>
                  <th style={{ padding: '10px' }}>Valor Total</th>
                  <th style={{ padding: '10px' }}>Preço Médio</th>
                  <th style={{ padding: '10px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhum investimento encontrado.</td></tr>
                ) : (
                  filteredInvestments.map(inv => {
                    const bankName = accounts.find(a => a.id === (inv as any).bankAccountId)?.name || 'N/A';
                    const isCofrinho = inv.type === 'OUTROS';
                    const totVal = inv.quantity * inv.currentValue;

                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px' }}><strong>{inv.ticker}</strong></td>
                        <td style={{ padding: '10px' }}>{inv.type}</td>
                        <td style={{ padding: '10px' }}><strong>{bankName}</strong></td>
                        <td style={{ padding: '10px' }}>{isCofrinho ? '-' : inv.quantity}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>R$ {totVal.toFixed(2)}</td>
                        <td style={{ padding: '10px', color: '#2563eb' }}>
                          {isCofrinho ? '-' : `R$ ${inv.averagePrice.toFixed(2)}`}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={() => handleEditInvestment(inv)} style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px', cursor: 'pointer' }}>✏️ Editar</button>
                          <button onClick={() => handleDeleteInvestment(inv.id!)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Conta */}
      {showAccountModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleSaveAccount} style={styles.modalContent}>
            <h3>{editingAccId ? 'Editar Conta Bancária' : 'Cadastrar Conta/Banco'}</h3>
            <label>Nome do Banco:</label>
            <input type="text" required value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Nubank, Itaú" style={styles.inputFull} />
            <label>Saldo Atual (R$):</label>
            <input type="number" step="0.01" required value={accBalance} onChange={e => setAccBalance(e.target.value)} placeholder="0.00" style={styles.inputFull} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowAccountModal(false)}>Cancelar</button>
              <button type="submit" style={styles.btnPrimary}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Cartão */}
      {showCardModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleSaveCard} style={styles.modalContent}>
            <h3>{editingCardId ? 'Editar Cartão de Crédito' : 'Cadastrar Cartão de Crédito'}</h3>
            <label>Nome do Cartão:</label>
            <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Ex: Nubank UV" style={styles.inputFull} />
            <label>Limite Total (R$):</label>
            <input type="number" step="0.01" required value={cardLimit} onChange={e => setCardLimit(e.target.value)} style={styles.inputFull} />
            <label>Conta para Pagamento:</label>
            <select value={cardBankId} onChange={e => setCardBankId(e.target.value)} required style={styles.inputFull}>
              <option value="">Selecione a Conta...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label>Dia Fechamento:</label>
                <input type="number" min="1" max="31" value={cardClosing} onChange={e => setCardClosing(e.target.value)} style={styles.inputFull} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Dia Vencimento:</label>
                <input type="number" min="1" max="31" value={cardDue} onChange={e => setCardDue(e.target.value)} style={styles.inputFull} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowCardModal(false)}>Cancelar</button>
              <button type="submit" style={styles.btnPrimary}>Salvar Cartão</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Transação */}
      {showTxModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleSaveTransaction} style={styles.modalContent}>
            <h3>{editingTxId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>

            <label>Fluxo:</label>
            <select value={txFlow} onChange={e => setTxFlow(e.target.value as any)} style={styles.inputFull}>
              <option value="SAIDA">Saída (Débito / Despesa)</option>
              <option value="ENTRADA">Entrada (Crédito / Receita)</option>
            </select>

            <label>Descrição:</label>
            <input type="text" required value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Ex: Compras Supermercado" style={styles.inputFull} />

            <label>Detalhes (Opcional):</label>
            <input type="text" value={txDetails} onChange={e => setTxDetails(e.target.value)} placeholder="Ex: Itens de limpeza" style={styles.inputFull} />

            <label>Tipo de Operação:</label>
            <select value={txType} onChange={e => setTxType(e.target.value as any)} style={styles.inputFull}>
              <option value="DEBITO">Débito</option>
              <option value="PIX">PIX</option>
              <option value="CREDITO">Crédito</option>
            </select>

            <label>Categoria:</label>
            <select value={txCategory} onChange={e => setTxCategory(e.target.value)} style={styles.inputFull}>
              {customCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <label>Valor (R$):</label>
            <input type="number" step="0.01" required value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" style={styles.inputFull} />

            <label>Data da Transação:</label>
            <input type="date" required value={txDate} onChange={e => setTxDate(e.target.value)} style={styles.inputFull} />

            {txType === 'CREDITO' ? (
              <>
                <label>Cartão de Crédito:</label>
                <select value={txCardId} onChange={e => setTxCardId(e.target.value)} required style={styles.inputFull}>
                  <option value="">Selecione o Cartão...</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {!editingTxId && (
                  <>
                    <label>Parcelas:</label>
                    <input type="number" min="1" max="72" value={txInstallments} onChange={e => setTxInstallments(Number(e.target.value))} style={styles.inputFull} />
                  </>
                )}
              </>
            ) : (
              <>
                <label>Conta / Banco:</label>
                <select value={txAccId} onChange={e => setTxAccId(e.target.value)} required style={styles.inputFull}>
                  <option value="">Selecione a Conta...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '16px' }}>
              {editingTxId ? (
                <button type="button" onClick={() => handleDeleteTransaction(editingTxId)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
              ) : <div />}
              <div>
                <button type="button" onClick={() => setShowTxModal(false)} style={{ marginRight: '8px' }}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Gerenciar Categorias */}
      {showCategoryModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>⚙️ Gerenciar Categorias</h3>
            
            <form onSubmit={handleAddCategory} style={{ marginBottom: '16px' }}>
              <label>Adicionar Nova Categoria:</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input type="text" required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Petshop" style={{ flex: 1, padding: '8px' }} />
                <button type="submit" style={styles.btnPrimary}>Adicionar</button>
              </div>
            </form>

            <label>Categorias Atuais:</label>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              {customCategories.map(cat => (
                <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span>{cat}</span>
                  <button onClick={() => handleDeleteCategory(cat)} style={{ padding: '2px 6px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowCategoryModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Investimento */}
      {showInvestModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleSaveInvestment} style={styles.modalContent}>
            <h3>{editingInvestId ? 'Editar Investimento / Caixinha' : 'Cadastrar Investimento / Caixinha'}</h3>
            <label>Tipo:</label>
            <select value={invType} onChange={e => setInvType(e.target.value as any)} style={styles.inputFull}>
              <option value="AÇÕES">Ação</option>
              <option value="FII">FII (Fundo Imobiliário)</option>
              <option value="RENDA_FIXA">Tesouro Direto / Renda Fixa</option>
              <option value="OUTROS">Caixinha / Cofrinho / Outros</option>
            </select>

            <label>Nome / Ticker:</label>
            <input type="text" required value={invTicker} onChange={e => setInvTicker(e.target.value)} placeholder="Ex: PETR4, HGLG11, Reserva de Emergência" style={styles.inputFull} />

            <label>Banco Custodiante:</label>
            <select value={invBankId} onChange={e => setInvBankId(e.target.value)} required style={styles.inputFull}>
              <option value="">Selecione o Banco...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            <label>Valor Total Investido (R$):</label>
            <input type="number" step="0.01" required value={invTotalValue} onChange={e => setInvTotalValue(e.target.value)} placeholder="0.00" style={styles.inputFull} />

            {invType !== 'OUTROS' && (
              <>
                <label>Quantidade de Cotas:</label>
                <input type="number" step="0.01" required value={invQuantity} onChange={e => setInvQuantity(e.target.value)} placeholder="1" style={styles.inputFull} />

                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>
                  <small>Preço Médio Calculado por Cota:</small>
                  <strong style={{ display: 'block', color: '#2563eb', fontSize: '16px' }}>
                    R$ {(parseFloat(invTotalValue) / (parseFloat(invQuantity) || 1) || 0).toFixed(2)}
                  </strong>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '16px' }}>
              {editingInvestId ? (
                <button type="button" onClick={() => handleDeleteInvestment(editingInvestId)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Apagar</button>
              ) : <div />}
              <div>
                <button type="button" onClick={() => setShowInvestModal(false)} style={{ marginRight: '8px' }}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary}>Salvar</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}