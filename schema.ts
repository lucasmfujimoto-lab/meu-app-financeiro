import Dexie, { type Table } from 'dexie';

// 1. Estrutura das Contas Bancárias
export interface BankAccount {
  id?: number;
  name: string;             // ex: Nubank, Itaú, Bradesco
  color: string;            // Cor visual para identificação
  currentBalance: number;   // Saldo em conta corrente
}

// 2. Caixinhas / Cofrinhos
export interface SavingsBox {
  id?: number;
  bankAccountId: number;    // Banco onde está guardado
  name: string;             // ex: Reserva de Emergência
  currentAmount: number;    // Valor guardado
}

// 3. Cartões de Crédito com Limite
export interface CreditCard {
  id?: number;
  bankAccountId: number;    // Banco que paga a fatura
  name: string;             // ex: Nubank Ultravioleta
  limitAmount: number;      // LIMITE TOTAL
  closingDay: number;       // Dia de fechamento da fatura (ex: dia 20)
  dueDay: number;           // Dia do vencimento (ex: dia 27)
}

// 4. Lançamentos / Transações
export interface Transaction {
  id?: number;
  description: string;      // Título da compra
  details?: string;         // Observações
  type: 'DEBITO' | 'PIX' | 'CREDITO' | 'TRANSFERENCIA';
  category: string;         // ex: Mercado, Uber, Shopping, etc.
  amount: number;           // Valor
  date: string;             // Data escolhida no calendário (AAAA-MM-DD)
  bankAccountId?: number;   // Conta usada
  creditCardId?: number;    // Cartão usado
  installmentsCount?: number; // Quantidade de parcelas
}

// 5. Parcelas de Crédito
export interface Installment {
  id?: number;
  transactionId: number;
  installmentNumber: number; // Ex: Parcela 1 de 10
  amount: number;            // Valor da parcela
  billingMonth: string;      // Mês/Ano da fatura (Formato: AAAA-MM)
  creditCardId: number;
  status: 'PENDENTE' | 'PAGO';
}

// 6. Despesas Fixas Mensais
export interface RecurringExpense {
  id?: number;
  title: string;            // Ex: Aluguel, Netflix, Internet
  details?: string;         // Ex: "Contrato nº 1234 - Reajuste em Junho"
  amount: number;           // Valor fixo mensal
  dueDay: number;           // Dia do vencimento (1 a 31)
  category: string;         // Categoria da despesa
  paymentMethod: 'DEBITO_CONTA' | 'CARTAO_CREDITO';
  bankAccountId?: number;
  creditCardId?: number;
  active: boolean;          // Se está ativa ou cancelada
}

// 7. Investimentos
export interface Investment {
  id?: number;
  ticker: string;            // Ex: PETR4, MXRF11, CDB
  type: 'AÇÕES' | 'FII' | 'RENDA_FIXA' | 'OUTROS';
  quantity: number;
  averagePrice: number;      // Preço de compra
  currentValue: number;      // Valor atual inserido manualmente
}

// Inicialização do Banco de Dados Local (IndexedDB)
class FinanceDB extends Dexie {
  accounts!: Table<BankAccount>;
  savings!: Table<SavingsBox>;
  cards!: Table<CreditCard>;
  transactions!: Table<Transaction>;
  installments!: Table<Installment>;
  recurringExpenses!: Table<RecurringExpense>;
  investments!: Table<Investment>;

  constructor() {
    super('MeuFinanceiroDB');
    this.version(1).stores({
      accounts: '++id, name',
      savings: '++id, bankAccountId',
      cards: '++id, bankAccountId',
      transactions: '++id, date, type, category, bankAccountId, creditCardId',
      installments: '++id, transactionId, billingMonth, creditCardId',
      recurringExpenses: '++id, paymentMethod, active',
      investments: '++id, ticker, type'
    });
  }
}

export const db = new FinanceDB();