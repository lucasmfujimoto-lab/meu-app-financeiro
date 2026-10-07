export const styles = {
  container: {
    fontFamily: 'sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '16px'
  },
  navTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  tabBtn: (active: boolean) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    backgroundColor: active ? '#2563eb' : '#cbd5e1',
    color: active ? '#ffffff' : '#334155'
  }),
  btnExcel: {
    padding: '8px 16px',
    marginRight: '8px',
    cursor: 'pointer',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '4px'
  },
  btnPdf: {
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '4px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  card: {
    background: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  actionsBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const
  },
  btnPrimary: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold' as const
  },
  btnSecondary: {
    background: '#475569',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '30px'
  },
  inputFull: {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#fff',
    padding: '24px',
    borderRadius: '8px',
    width: '400px',
    maxHeight: '90vh',
    overflowY: 'auto' as const
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px'
  }
};