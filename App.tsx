import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Device } from '@capacitor/device';
import { App as CapacitorApp } from '@capacitor/app';
import { Lock } from 'lucide-react';

import { UIProvider, useUI } from './contexts/UIContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TRANSLATIONS } from './translations';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentsList } from './pages/DocumentsList';
import { DocumentForm } from './pages/DocumentForm';
import { Settings } from './pages/Settings';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Workflow } from './pages/Workflow';
import { RecycleBin } from './pages/RecycleBin';
import { TaxReport } from './pages/TaxReport';

import { AppState, DocType, Document, Lang, Customer, Product, CompanySettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_CUSTOMERS, DEFAULT_PRODUCTS, ORDERED_DOC_TYPES } from './constants';
import { generateValidKey, getNextDocNumber } from './utils';

const TechFabApp = () => {
  const { toast, alert, confirm } = useUI();
  const [state, setState] = useLocalStorage<AppState>('techfab_billing_state', {
    documents: [],
    customers: DEFAULT_CUSTOMERS,
    products: DEFAULT_PRODUCTS,
    settings: DEFAULT_SETTINGS,
  });

  const [lang, setLang] = useState<Lang>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const info = await Device.getId();
      const generatedPass = generateValidKey((info as any).uuid || (info as any).identifier || 'unknown');
      setAdminPassword(generatedPass);
      console.log('Admin Password:', generatedPass);
    };
    initAuth();

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) { CapacitorApp.exitApp(); }
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === adminPassword) {
      setIsAuthenticated(true);
    } else {
      toast('Incorrect Password', 'error');
    }
  };

  const handleSaveDocument = (doc: Document) => {
    setState(prev => {
      const exists = prev.documents.find(d => d.id === doc.id);
      if (exists) {
        return { ...prev, documents: prev.documents.map(d => d.id === doc.id ? doc : d) };
      }
      return { ...prev, documents: [...prev.documents, doc] };
    });
    // This is optional, pages handle navigation usually, but a toast here doesn't hurt if we want global feedback
  };

  const handleDeleteDocument = async (id: string) => {
    if (await confirm('Are you sure you want to move this document to the Recycle Bin?', 'Move to Recycle Bin')) {
      setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, isDeleted: true } : d) }));
      toast('Moved to Recycle Bin', 'success');
    }
  };

  const handleRestoreDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, isDeleted: false } : d) }));
    toast('Document Restored', 'success');
  };

  const handlePermanentDelete = async (id: string) => {
    if (await confirm('This action cannot be undone. Permanently delete?', 'Delete Permanently', 'Delete')) {
      const input = await prompt(lang === 'zh' ? "请输入管理员密码以确认永久删除" : "Enter Admin Password to confirm permanent deletion", 'Security Check');
      if (input === adminPassword) {
        setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
        toast('Permanently Deleted', 'info');
      } else if (input !== null) {
        toast(TRANSLATIONS[lang].access_denied, 'error');
      }
    }
  };

  const handleConvertDocument = (doc: Document, toType: DocType) => {
    const newDoc: Document = {
      ...doc,
      id: Math.random().toString(36).substr(2, 9),
      type: toType,
      number: getNextDocNumber(state.documents, toType, toType === DocType.INVOICE ? 'INV' : toType === DocType.DELIVERY_ORDER ? 'DO' : 'PF'),
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      isDeleted: false
    };

    setState(prev => ({
      ...prev,
      documents: [...prev.documents.map(d => d.id === doc.id ? { ...d, status: 'Converted' as const } : d), newDoc]
    }));

    toast(`Converted to ${toType} ${newDoc.number}`, 'success');
  };

  const handleUpdateStatus = (id: string, status: Document['status']) => {
    setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, status } : d) }));
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.documents && data.customers && data.settings) {
          setState(data);
          toast('Data restored successfully!', 'success');
        } else {
          toast('Invalid backup file format', 'error');
        }
      } catch (err) {
        toast('Error parsing backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Techfab Billing</h1>
            <p className="text-slate-500 font-medium mt-2">Enter credentials to access system</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin Password"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-black tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
            />
            <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95">
              Authenticate
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Device ID: {adminPassword || 'Loading...'}</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout onLogout={() => setIsAuthenticated(false)} lang={lang} setLang={setLang}>
        <Routes>
          <Route path="/" element={<Dashboard state={state} lang={lang} />} />
          <Route path="/documents" element={<DocumentsList state={state} onDelete={handleDeleteDocument} onConvert={handleConvertDocument} onUpdateStatus={handleUpdateStatus} lang={lang} />} />
          <Route path="/documents/new" element={<DocumentForm state={state} onSave={handleSaveDocument} lang={lang} adminPassword={adminPassword} />} />
          <Route path="/documents/:id/edit" element={<DocumentForm state={state} onSave={handleSaveDocument} lang={lang} adminPassword={adminPassword} />} />
          <Route path="/recycle-bin" element={<RecycleBin state={state} onRestore={handleRestoreDocument} onPermanentDelete={handlePermanentDelete} lang={lang} />} />
          <Route path="/tax-report" element={<TaxReport state={state} lang={lang} />} />
          <Route path="/customers" element={<Customers state={state} onAdd={(c) => setState(prev => ({ ...prev, customers: [...prev.customers, c] }))} onUpdate={(c) => setState(prev => ({ ...prev, customers: prev.customers.map(cust => cust.id === c.id ? c : cust) }))} onDelete={(id) => setState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }))} lang={lang} />} />
          <Route path="/products" element={<Products state={state} onAdd={(p) => setState(prev => ({ ...prev, products: [...prev.products, p] }))} onUpdate={(p) => setState(prev => ({ ...prev, products: prev.products.map(prod => prod.id === p.id ? p : prod) }))} onDelete={(id) => setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }))} lang={lang} />} />
          <Route path="/workflow" element={<Workflow state={state} onConvert={handleConvertDocument} onUpdateStatus={handleUpdateStatus} lang={lang} />} />
          <Route path="/settings" element={
            <Settings
              state={state}
              onSave={(settings) => { setState(prev => ({ ...prev, settings })); toast('Settings Saved', 'success'); }}
              onReset={() => setState({ documents: [], customers: DEFAULT_CUSTOMERS, products: DEFAULT_PRODUCTS, settings: DEFAULT_SETTINGS })}
              onExport={() => {
                const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              onImport={handleImportData}
              onChangePassword={(newPwd) => console.log('Password update not implemented for local-only')}
              lang={lang}
              adminPassword={adminPassword}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App = () => (
  <UIProvider>
    <TechFabApp />
  </UIProvider>
);

export default App;