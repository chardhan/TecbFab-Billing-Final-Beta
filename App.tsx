import { Preferences } from '@capacitor/preferences'; 
import { Share } from '@capacitor/share'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 
import { Capacitor } from '@capacitor/core'; 
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Plus, Search, LogOut, ChevronRight, TrendingUp, FileText, Users, AlertCircle, 
  Download, Copy, Trash2, Settings as SettingsIcon, CheckCircle2, Lock, Receipt, 
  Truck, ArrowRightLeft, ArrowRight, Menu, X, Image as ImageIcon, Clock, 
  CheckCircle, CreditCard, Ban, Activity, CalendarDays, Pencil, Package, 
  ShieldCheck, Key, Globe
} from 'lucide-react';
import { DocType, AppState, Document, Customer, CompanySettings, LineItem, Product } from './types';
// --- ✅ 更新导入：增加 roundTo ---
import { DOC_META, NAV_ITEMS, formatCurrency, roundTo } from './constants';
// --- ✅ 更新导入 ---
import { generateDocumentPDF, generateSummaryPDF } from './services/pdfService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- 🌐 多语言字典 ---
type Lang = 'en' | 'zh' | 'ms';

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    documents: "Documents",
    products: "Products",
    customers: "Customers",
    workflow: "Workflow",
    settings: "Settings",
    logout: "Logout",
    system_overview: "System Overview",
    new_transaction: "New Transaction",
    revenue: "Revenue",
    active_quotes: "Active Quotes",
    dispatch_queue: "Dispatch Queue",
    client_assets: "Client Assets",
    recent_activity: "Recent Activity",
    search_placeholder: "Search by ID or customer name...",
    doc_number: "Number",
    doc_type: "Type",
    customer: "Customer",
    total: "Total",
    actions: "Actions",
    create: "Create",
    edit: "Edit",
    save: "Save",
    discard: "Discard",
    delete: "Delete",
    convert_inv: "Convert to Invoice",
    convert_do: "Convert to DO",
    convert_pi: "Convert to Pro-Forma",
    download_pdf: "Download PDF",
    item_desc: "Description",
    quantity: "Qty",
    price: "Price",
    tax_rate: "Tax %",
    add_item: "Add Item",
    subtotal: "Subtotal",
    tax_total: "Tax Total",
    discount: "Discount",
    total_payable: "Total Payable",
    remarks: "Remarks & Terms",
    recipient: "Recipient",
    select_customer: "Select a customer...",
    factory_reset: "Factory Reset",
    backup_data: "Backup Data",
    restore_data: "Restore Data",
    update_password: "Update Password",
    contact_directory: "Contact Directory",
    new_contact: "New Contact",
    product_catalog: "Product Catalog",
    new_product: "New Product",
    billing_lifecycle: "Billing Lifecycle",
    stage_sales: "Stage 1: Sales",
    stage_fulfill: "Stage 2: Fulfillment",
    stage_billing: "Stage 3: Billing",
    factory_reset_confirm_msg: "WARNING: This will permanently delete ALL data. Continue?",
    enter_password_verify: "SECURITY CHECK: Enter Admin Password to confirm reset:",
    access_denied: "Incorrect Password! Access Denied.",
    data_wiped: "System reset successful. Reloading..."
  },
  zh: {
    dashboard: "仪表盘",
    documents: "单据列表",
    products: "产品管理",
    customers: "客户通讯录",
    workflow: "工作流",
    settings: "系统设置",
    logout: "退出登录",
    system_overview: "系统概览",
    new_transaction: "新建交易",
    revenue: "年度营收",
    active_quotes: "进行中报价",
    dispatch_queue: "待发货队列",
    client_assets: "客户总数",
    recent_activity: "最近动态",
    search_placeholder: "搜索单号或客户名称...",
    doc_number: "单号",
    doc_type: "类型",
    customer: "客户",
    total: "总金额",
    actions: "操作",
    create: "创建",
    edit: "编辑",
    save: "保存",
    discard: "放弃",
    delete: "删除",
    convert_inv: "转为发票",
    convert_do: "转为发货单",
    convert_pi: "转为形式发票",
    download_pdf: "下载 PDF",
    item_desc: "项目描述",
    quantity: "数量",
    price: "单价",
    tax_rate: "税率 %",
    add_item: "添加项目",
    subtotal: "小计",
    tax_total: "税额",
    discount: "折扣",
    total_payable: "应付总额",
    remarks: "备注与条款",
    recipient: "接收方",
    select_customer: "请选择客户...",
    factory_reset: "恢复出厂设置",
    backup_data: "备份数据",
    restore_data: "恢复数据",
    update_password: "修改密码",
    contact_directory: "客户名录",
    new_contact: "新增客户",
    product_catalog: "产品目录",
    new_product: "新增产品",
    billing_lifecycle: "单据生命周期",
    stage_sales: "阶段 1: 销售",
    stage_fulfill: "阶段 2: 交付",
    stage_billing: "阶段 3: 结算",
    factory_reset_confirm_msg: "警告：此操作将永久删除所有数据！确定继续吗？",
    enter_password_verify: "安全检查：请输入管理员密码以确认重置：",
    access_denied: "密码错误！拒绝访问。",
    data_wiped: "系统已重置。正在重新加载..."
  },
  ms: {
    dashboard: "Papan Pemuka",
    documents: "Dokumen",
    products: "Produk",
    customers: "Pelanggan",
    workflow: "Aliran Kerja",
    settings: "Tetapan",
    logout: "Log Keluar",
    system_overview: "Gambaran Sistem",
    new_transaction: "Transaksi Baru",
    revenue: "Hasil Tahunan",
    active_quotes: "Sebutharga Aktif",
    dispatch_queue: "Baris Gilir Penghantaran",
    client_assets: "Jumlah Pelanggan",
    recent_activity: "Aktiviti Terkini",
    search_placeholder: "Cari ID atau nama pelanggan...",
    doc_number: "No. Dokumen",
    doc_type: "Jenis",
    customer: "Pelanggan",
    total: "Jumlah",
    actions: "Tindakan",
    create: "Cipta",
    edit: "Sunting",
    save: "Simpan",
    discard: "Batal",
    delete: "Padam",
    convert_inv: "Tukar ke Invois",
    convert_do: "Tukar ke DO",
    convert_pi: "Tukar ke Pro-Forma",
    download_pdf: "Muat Turun PDF",
    item_desc: "Deskripsi",
    quantity: "Kuantiti",
    price: "Harga Seunit",
    tax_rate: "Cukai %",
    add_item: "Tambah Item",
    subtotal: "Subjumlah",
    tax_total: "Jumlah Cukai",
    discount: "Diskaun",
    total_payable: "Jumlah Perlu Dibayar",
    remarks: "Nota & Terma",
    recipient: "Penerima",
    select_customer: "Pilih pelanggan...",
    factory_reset: "Tetapan Semula Kilang",
    backup_data: "Sandaran Data",
    restore_data: "Pulihkan Data",
    update_password: "Tukar Kata Laluan",
    contact_directory: "Direktori Pelanggan",
    new_contact: "Pelanggan Baru",
    product_catalog: "Katalog Produk",
    new_product: "Produk Baru",
    billing_lifecycle: "Kitaran Bil",
    stage_sales: "Peringkat 1: Jualan",
    stage_fulfill: "Peringkat 2: Penghantaran",
    stage_billing: "Peringkat 3: Bil",
    factory_reset_confirm_msg: "AMARAN: Ini akan memadamkan SEMUA data secara kekal. Teruskan?",
    enter_password_verify: "PEMERIKSAAN KESELAMATAN: Masukkan Kata Laluan Admin untuk pengesahan:",
    access_denied: "Kata Laluan Salah! Akses Ditolak.",
    data_wiped: "Sistem berjaya ditetapkan semula. Memuat semula..."
  }
};

const ORDERED_DOC_TYPES = [
  DocType.QUOTATION,
  DocType.PROFORMA,
  DocType.DELIVERY_ORDER,
  DocType.INVOICE
];

const DEFAULT_SETTINGS: CompanySettings = {
  name: "Techfab Solutions",
  address: "Lot 123, Level 2, Wisma Merdeka, Jalan Sultan Ismail, 50250 Kuala Lumpur, Malaysia",
  ssmNumber: "202401012345 (1234567-X)",
  sstRegNo: "W10-1808-32000000",
  phone: "+603-2166 8888",
  email: "billing@techfab.com.my",
  bankName: "Maybank",
  bankAccount: "5140-1234-5678",
  sstRate: 0.08,
  logo: "",
  signature: "" 
};

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Petronas Dagangan Bhd', address: 'Level 40, Tower 1, PETRONAS Twin Towers, 50088 Kuala Lumpur', email: 'procurement@petronas.com', phone: '03-20515000', attentionTo: 'En. Ahmad' },
  { id: 'c2', name: 'Maxis Broadband Sdn Bhd', address: 'Level 18, Menara Maxis, Kuala Lumpur City Centre, 50088 KL', email: 'accounts@maxis.com.my', phone: '03-23307000' }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Consultation Fee', price: 150.00, description: 'Professional technical consultation (Hourly)', taxRate: 0.08 },
  { id: 'p2', name: 'Site Visit', price: 300.00, description: 'On-site inspection and travel expenses', taxRate: 0 }
];

const getNextDocNumber = (docs: Document[], type: DocType, prefix: string) => {
  const currentYear = new Date().getFullYear();
  const yearDocs = docs.filter(d => d.type === type && d.number.includes(`-${currentYear}-`));
  let maxSeq = 0;
  yearDocs.forEach(d => {
    const parts = d.number.split('-');
    const seq = parseInt(parts[parts.length - 1]);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${nextSeq}`;
};

// --- ✅ 统一财务计算函数 (已引入精确四舍五入) ---
const calculateGrandTotal = (doc: Document) => {
  const subtotal = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice), 0);
  const tax = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice * (i.taxRate || 0)), 0);
  const total = roundTo(subtotal + tax - (doc.discount || 0));
  return Math.max(0, total);
};

const generateValidKey = (sysId: string) => {
    const sum = sysId.split('').reduce((acc, char) => {
        const num = parseInt(char);
        return isNaN(num) ? acc : acc + num;
    }, 0);
    return (sum * 888).toString();
};

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  useEffect(() => {
    const loadData = async () => {
      try {
        const { value } = await Preferences.get({ key: key });
        if (value !== null) setStoredValue(JSON.parse(value));
      } catch (error) { console.error("读取存储失败:", error); }
    };
    loadData();
  }, [key]);
  useEffect(() => {
    const saveData = async () => {
      try {
        await Preferences.set({ key: key, value: JSON.stringify(storedValue) });
      } catch (error) { console.error("保存存储失败:", error); }
    };
    saveData();
  }, [key, storedValue]);
  return [storedValue, setStoredValue] as const;
}

const Sidebar = ({ isOpen, onClose, onLogout, lang, setLang }: { isOpen: boolean, onClose: () => void, onLogout: () => void, lang: Lang, setLang: (l: Lang) => void }) => {
  const location = useLocation();
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  const MENU_ITEMS = [
    { label: t('dashboard'), path: '/', icon: <TrendingUp /> },
    { label: t('documents'), path: '/documents', icon: <FileText /> },
    { label: t('products'), path: '/products', icon: <Package /> },
    { label: t('customers'), path: '/customers', icon: <Users /> },
    { label: t('workflow'), path: '/workflow', icon: <ArrowRightLeft /> },
    { label: t('settings'), path: '/settings', icon: <SettingsIcon /> },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-800 no-print`}>
        <div className="pt-[env(safe-area-inset-top)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">TF</div>
            <h1 className="text-xl font-bold text-white tracking-tight">Techfab</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => onClose()} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'hover:bg-slate-800 hover:text-white border border-transparent'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { className: `w-5 h-5 ${isActive ? 'text-emerald-400' : ''}` })}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg">
             <button onClick={()=>setLang('en')} className={`text-[10px] font-bold py-1 rounded ${lang==='en'?'bg-slate-800 text-white':'text-slate-500 hover:text-slate-300'}`}>EN</button>
             <button onClick={()=>setLang('zh')} className={`text-[10px] font-bold py-1 rounded ${lang==='zh'?'bg-slate-800 text-white':'text-slate-500 hover:text-slate-300'}`}>中文</button>
             <button onClick={()=>setLang('ms')} className={`text-[10px] font-bold py-1 rounded ${lang==='ms'?'bg-slate-800 text-white':'text-slate-500 hover:text-slate-300'}`}>BM</button>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Dashboard = ({ state, lang }: { state: AppState, lang: Lang }) => {
  const [isMounted, setIsMounted] = useState(false);
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  useEffect(() => { const timer = setTimeout(() => setIsMounted(true), 250); return () => clearTimeout(timer); }, []);
  const sortedDocs = useMemo(() => [...state.documents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.documents]);
  
  const totalInvoiced = useMemo(() => 
    state.documents
      .filter(d => d.type === DocType.INVOICE && d.status !== 'Cancelled')
      .reduce((sum, d) => sum + calculateGrandTotal(d), 0)
  , [state.documents]);

  const activeQuotes = state.documents.filter(d => d.type === DocType.QUOTATION && d.status !== 'Converted' && d.status !== 'Cancelled').length;
  const totalDOs = state.documents.filter(d => d.type === DocType.DELIVERY_ORDER && d.status !== 'Cancelled').length;
  
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyTotals = new Array(12).fill(0);
    state.documents.filter(d => d.type === DocType.INVOICE && d.status !== 'Cancelled').forEach(doc => {
      const d = new Date(doc.date);
      if (d.getFullYear() === currentYear) {
        monthlyTotals[d.getMonth()] += calculateGrandTotal(doc);
      }
    });
    return months.map((name, i) => ({ name, val: monthlyTotals[i] }));
  }, [state.documents]);

  // --- ✅ 自动备份提醒逻辑 ---
  const daysSinceBackup = useMemo(() => {
    if (!state.lastBackupDate) return 999; // 从未备份
    const last = new Date(state.lastBackupDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  }, [state.lastBackupDate]);

  const showBackupWarning = daysSinceBackup >= 7;

  const handleDownloadMonthlyReport = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); 
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const periodString = `${months[currentMonth]} ${currentYear}`;

    const monthDocs = state.documents.filter(doc => {
      const d = new Date(doc.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && doc.status !== 'Cancelled';
    });

    const formattedData = monthDocs.map(doc => {
      const subtotal = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice), 0);
      const tax = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice * (i.taxRate || 0)), 0);
      const customer = state.customers.find(c => c.id === doc.customerId);
      return {
        date: doc.date,
        number: doc.number,
        customerName: customer?.name || 'Unknown',
        subtotal: subtotal,
        tax: tax,
        total: calculateGrandTotal(doc)
      };
    });

    if (formattedData.length === 0) {
      alert("No activity data for current month.");
      return;
    }

    await generateSummaryPDF(formattedData, state.settings, periodString);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ✅ 备份提醒横幅 */}
      {showBackupWarning && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><AlertCircle className="w-6 h-6" /></div>
            <div>
              <p className="font-black text-amber-900 text-sm">数据安全提醒 / Backup Required</p>
              <p className="text-amber-700 text-xs font-bold mt-0.5">
                {daysSinceBackup > 30 ? '你已经很久没有备份数据了。' : `你已经有 ${daysSinceBackup} 天没有备份数据了。`} 请前往设置进行备份。
              </p>
            </div>
          </div>
          <Link to="/settings" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-amber-600/20">立即备份</Link>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Live System</span>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5"><CalendarDays className="w-3 h-3" />{new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{t('system_overview')}</h1>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Link to="/documents/new" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"><Plus className="w-4 h-4" /> {t('new_transaction')}</Link>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title={t('revenue')} value={formatCurrency(totalInvoiced)} icon={<Receipt className="text-emerald-500" />} trend="Current Year Total" color="emerald" />
        <StatCard title={t('active_quotes')} value={activeQuotes.toString()} icon={<FileText className="text-blue-500" />} trend="Awaiting Customer" color="blue" />
        <StatCard title={t('dispatch_queue')} value={totalDOs.toString()} icon={<Truck className="text-purple-500" />} trend="Ready for Shipping" color="purple" />
        <StatCard title={t('client_assets')} value={state.customers.length.toString()} icon={<Users className="text-amber-500" />} trend="Verified Contacts" color="amber" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
           <div className="p-7 border-b border-slate-100 flex items-center justify-between">
            <div><h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5"><TrendingUp className="w-6 h-6 text-emerald-500" />{t('revenue')}</h3><p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Monthly Billing Aggregation (MYR)</p></div>
            {/* --- ✅ 汇总报告按钮 --- */}
            <button 
              onClick={handleDownloadMonthlyReport}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition-all text-xs font-bold border border-slate-100 active:scale-95"
            >
              <Download className="w-4 h-4" /> {t('download_pdf')}
            </button>
          </div>
          <div className="p-8 flex-1 w-full relative">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} /><Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '16px' }} /><Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={50}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.val > 0 ? '#10b981' : '#e2e8f0'} />))}</Bar></BarChart></ResponsiveContainer>
            ) : <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm font-black uppercase tracking-widest">Computing Visual Engine...</div>}
          </div>
        </div>
        <div className="xl:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
          <div className="p-7 border-b border-slate-100"><h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5"><Activity className="w-6 h-6 text-blue-500" />{t('recent_activity')}</h3><p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Global transaction feed</p></div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar">
            {sortedDocs.length === 0 ? <div className="text-center py-20 flex flex-col items-center justify-center opacity-30"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Clock className="w-8 h-8 text-slate-400" /></div><p className="text-slate-500 text-sm font-black uppercase tracking-widest">No activity found</p></div> : sortedDocs.slice(0, 10).map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                <div className={`w-11 h-11 rounded-xl ${DOC_META[doc.type].color} shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>{React.cloneElement(DOC_META[doc.type].icon as React.ReactElement, { className: 'w-5 h-5' })}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2 mb-0.5"><p className="font-black text-slate-900 text-sm truncate">{doc.number}</p><p className="text-[10px] text-slate-400 font-bold uppercase shrink-0">{doc.date}</p></div><p className="text-xs text-slate-500 truncate font-semibold">{state.customers.find(c => c.id === doc.customerId)?.name}</p></div>
                <div className="text-right shrink-0"><p className="text-sm font-black text-slate-900">{formatCurrency(calculateGrandTotal(doc))}</p><span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${doc.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : doc.status === 'Cancelled' ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-100'}`}>{doc.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string, color: string }) => (
  <div className={`p-6 rounded-[2rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-44 bg-white relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 opacity-[0.03] group-hover:scale-150 transition-transform duration-500`}>{React.cloneElement(icon as React.ReactElement, { className: 'w-full h-full' })}</div>
    <div className="flex justify-between items-start relative z-10"><div className={`p-3 rounded-2xl bg-slate-50 group-hover:bg-white group-hover:shadow-lg transition-all`}>{icon}</div><span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-wider">Metrics</span></div>
    <div className="relative z-10"><h4 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-1.5">{title}</h4><p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p></div>
    <div className="flex items-center gap-1.5 relative z-10"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{trend}</p></div>
  </div>
);

const DocumentsList = ({ state, onDelete, onConvert, lang }: { state: AppState, onDelete: (id: string) => void, onConvert: (doc: Document, toType: DocType) => void, lang: Lang }) => {
  const [filter, setFilter] = useState<DocType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  
  const filteredDocs = useMemo(() => state.documents.filter(doc => {
    const matchesFilter = filter === 'ALL' || doc.type === filter;
    const customer = state.customers.find(c => c.id === doc.customerId);
    const matchesSearch = doc.number.toLowerCase().includes(search.toLowerCase()) || customer?.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [state.documents, filter, search, state.customers]);

  const handlePdfDownload = async (doc: Document) => {
    const customer = state.customers.find(c => c.id === doc.customerId);
    if (customer) {
      try { 
        const cleanNumber = doc.number.replace(/[^a-zA-Z0-9-]/g, '_');
        const sanitizedDoc = {
          ...doc,
          number: cleanNumber.trim()
        };
        await generateDocumentPDF(sanitizedDoc, customer, state.settings); 
      } catch (err: any) { 
        alert(`PDF Error (0013): 请确保单号中不含特殊字符。错误详情: ${err.message}`); 
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('documents')}</h1><p className="text-slate-500">Professional workflow management.</p></div>
        <Link to="/documents/new" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95"><Plus className="w-5 h-5" />{t('new_transaction')}</Link>
      </header>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder={t('search_placeholder')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
            {(['ALL', ...ORDERED_DOC_TYPES] as const).map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('doc_number')}</th><th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('doc_type')}</th><th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('customer')}</th><th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('total')}</th><th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">{t('actions')}</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const customer = state.customers.find(c => c.id === doc.customerId);
                const total = calculateGrandTotal(doc);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{doc.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${DOC_META[doc.type].color}`}>{doc.type}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 truncate max-w-[150px]">{customer?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">{formatCurrency(total)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlePdfDownload(doc)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title={t('download_pdf')}><Download className="w-4 h-4" /></button>
                        <button onClick={() => navigate(`/documents/${doc.id}/edit`)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={t('edit')}><Pencil className="w-4 h-4" /></button>
                        
                        {doc.type === DocType.QUOTATION && ( <button onClick={() => onConvert(doc, DocType.PROFORMA)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title={t('convert_pi')}><FileText className="w-4 h-4" /></button>)}
                        
                        {(doc.type === DocType.QUOTATION || doc.type === DocType.PROFORMA) && (<button onClick={() => onConvert(doc, DocType.DELIVERY_ORDER)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title={t('convert_do')}><Truck className="w-4 h-4" /></button>)}

                        {(doc.type === DocType.PROFORMA || doc.type === DocType.DELIVERY_ORDER) && (<button onClick={() => onConvert(doc, DocType.INVOICE)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title={t('convert_inv')}><Receipt className="w-4 h-4" /></button>)}
                        
                        <button onClick={() => onDelete(doc.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDocs.length === 0 && <div className="p-16 text-center"><div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100"><Search className="w-8 h-8 text-slate-300" /></div><p className="text-slate-500 font-bold text-lg">No Documents Found</p></div>}
        </div>
      </div>
    </div>
  );
};

const DocumentForm = ({ state, onSave, lang }: { state: AppState, onSave: (doc: Document) => void, lang: Lang }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  
  const initialData = useMemo(() => {
    const type = DocType.QUOTATION;
    return { type, number: getNextDocNumber(state.documents, type, DOC_META[type].prefix) };
  }, [state.documents]);
  
  const [doc, setDoc] = useState<Partial<Document>>({
    id: Math.random().toString(36).substr(2, 9),
    type: initialData.type,
    number: initialData.number,
    date: new Date().toISOString().split('T')[0],
    customerId: state.customers[0]?.id || '',
    items: [{ id: Math.random().toString(), description: '', quantity: 0, unitPrice: 0, taxRate: 0 }], 
    status: 'Draft',
    discount: 0,
  });

  useEffect(() => { if (id) { const existingDoc = state.documents.find(d => d.id === id); if (existingDoc) setDoc(existingDoc); } }, [id, state.documents]);
  
  // --- ✅ 修正：DocumentForm 中的金额计算已同步 roundTo ---
  const subtotal = useMemo(() => doc.items?.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice), 0) || 0, [doc.items]);
  const tax = useMemo(() => doc.items?.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice * (i.taxRate || 0)), 0) || 0, [doc.items]);
  const total = roundTo(subtotal + tax - (doc.discount || 0));
  
  const addItem = () => { setDoc(prev => ({ ...prev, items: [...(prev.items || []), { id: Math.random().toString(), description: '', quantity: 0, unitPrice: 0, taxRate: 0 }] })); };
  
  const removeItem = (id: string) => { setDoc(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) })); };
  const updateItem = (id: string, field: keyof LineItem, value: any) => { setDoc(prev => ({ ...prev, items: prev.items?.map(i => i.id === id ? { ...i, [field]: value } : i) })); };
  const handleProductSelect = (itemId: string, productId: string) => {
    const product = (state.products || []).find(p => p.id === productId);
    if (product) { setDoc(prev => ({ ...prev, items: prev.items?.map(i => i.id === itemId ? { ...i, description: product.description || product.name, unitPrice: product.price, taxRate: product.taxRate !== undefined ? product.taxRate : state.settings.sstRate } : i) })); }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!doc.customerId) { alert("Please select a customer / 请选择客户"); return; }
    if (!doc.items || doc.items.length === 0) { alert("Please add at least one item / 请至少添加一项"); return; }

    for (let i = 0; i < doc.items.length; i++) {
        const item = doc.items[i];
        const lineNum = i + 1;

        if (!item.description || item.description.trim() === "") {
            alert(`Row ${lineNum} Error: Description is missing.\n第 ${lineNum} 行错误：必须填写项目描述。`);
            return;
        }
        if (!item.quantity || item.quantity <= 0) {
            alert(`Row ${lineNum} Error: Quantity must be greater than 0.\n第 ${lineNum} 行错误：数量必须大于 0。`);
            return;
        }
        if (item.unitPrice === undefined || item.unitPrice < 0.01) {
            alert(`Row ${lineNum} Error: Price must be at least 0.01.\n第 ${lineNum} 行错误：价格必须至少为 0.01。`);
            return;
        }
    }

    if (doc.customerId && doc.items && doc.items.length > 0) {
      onSave({ ...doc, id: doc.id || Math.random().toString(36).substr(2, 9) } as Document);
      navigate('/documents');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 active:scale-95"><ChevronRight className="w-5 h-5 rotate-180" /></button>
        <div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{id ? t('edit') : t('create')} {doc.type}</h1><p className="text-slate-500 font-medium">{id ? 'Modifying existing record' : `Drafting document #${doc.number}`}</p></div>
      </header>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{t('doc_type')}</label>
            <select 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
              value={doc.type} 
              onChange={(e) => !id && setDoc({...doc, type: e.target.value as DocType, number: getNextDocNumber(state.documents, e.target.value as DocType, DOC_META[e.target.value as DocType].prefix) })}
            >
              {ORDERED_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2"><label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{t('doc_number')}</label><input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" value={doc.number} onChange={(e) => setDoc({ ...doc, number: e.target.value })} required /></div>
          <div className="space-y-2"><label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Date</label><input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" value={doc.date} onChange={(e) => setDoc({ ...doc, date: e.target.value })} required /></div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{t('recipient')}</h3><Link to="/customers" className="text-sm text-emerald-600 font-bold hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">{t('contact_directory')}</Link></div>
          <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" value={doc.customerId} onChange={(e) => setDoc({ ...doc, customerId: e.target.value })} required><option value="">{t('select_customer')}</option>{state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {doc.customerId && <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-5 animate-in slide-in-from-top-2"><div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0"><Users className="w-6 h-6" /></div><div className="flex-1 min-w-0"><p className="font-bold text-slate-900 text-lg truncate">{state.customers.find(c => c.id === doc.customerId)?.name}</p><p className="text-sm text-slate-500 leading-relaxed font-medium mt-1">{state.customers.find(c => c.id === doc.customerId)?.address}</p></div></div>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center"><h3 className="font-extrabold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Line Items</h3><button type="button" onClick={addItem} className="bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"><Plus className="w-4 h-4" /> {t('add_item')}</button></div>
          <div className="divide-y divide-slate-100">
            {doc.items?.map((item, idx) => (
              <div key={item.id} className="p-6 grid grid-cols-12 gap-5 items-start">
                <div className="col-span-12 md:col-span-5 space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('item_desc')}</label><select className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 outline-none max-w-[150px] truncate" onChange={(e) => handleProductSelect(item.id, e.target.value)} value=""><option value="" disabled>✨ Load...</option>{(state.products || []).map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>)}</select></div>
                    <textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none min-h-[44px]" value={item.description} rows={Math.max(1, item.description.split('\n').length)} placeholder="Goods description..." onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                </div>
                <div className="col-span-6 md:col-span-2 space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('quantity')}</label><input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))} /></div>
                <div className="col-span-6 md:col-span-3 space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('price')} (RM)</label><input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))} /></div>
                <div className="col-span-12 md:col-span-2 flex flex-row md:flex-col items-center justify-between md:justify-start gap-3 pt-0 md:pt-0">
                  <div className="w-full space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('tax_rate')}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                      value={item.taxRate} 
                      onChange={(e) => updateItem(item.id, 'taxRate', Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={0.05}>5%</option>
                      <option value={0.06}>6%</option>
                      <option value={0.08}>8%</option>
                      <option value={0.10}>10%</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 mt-2 md:mt-auto"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200"><label className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">{t('remarks')}</label><textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none min-h-[120px]" placeholder="Include terms, bank info, or notes..." value={doc.notes} onChange={(e) => setDoc({ ...doc, notes: e.target.value })} /></div>
          </div>
          <div className="w-full md:w-80 bg-slate-900 text-white p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h4 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-[0.3em] border-b border-white/5 pb-4">Financial Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">{t('subtotal')}</span><span className="font-bold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">{t('tax_total')}</span><span className="font-bold text-blue-400">{formatCurrency(tax)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium">{t('discount')}</span><input type="number" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-right text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none" value={doc.discount} onChange={(e) => setDoc({ ...doc, discount: Math.max(0, Number(e.target.value)) })} /></div>
            </div>
            <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end"><div><span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{t('total_payable')}</span><span className="text-3xl font-extrabold text-white tracking-tighter leading-none">{formatCurrency(total)}</span></div></div>
            <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95">{id ? t('save') : t('create')}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

const Settings = ({ state, onSave, onReset, onExport, onImport, onChangePassword, lang, adminPassword }: { state: AppState, onSave: (settings: CompanySettings) => void, onReset: () => void, onExport: () => void, onImport: (file: File) => void, onChangePassword: (newPwd: string) => void, lang: Lang, adminPassword: string }) => {
  const [settings, setSettings] = useState<CompanySettings>(state.settings);
  const [newPass, setNewPass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null); 

  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { if (file.size > 200 * 1024) { alert("Logo file is too large."); return; } const reader = new FileReader(); reader.onloadend = () => { setSettings({ ...settings, logo: reader.result as string }); }; reader.readAsDataURL(file); }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) { alert("Signature file is too large."); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, signature: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) onImport(file); };
  const handleSafeReset = () => { if (confirm(t('factory_reset_confirm_msg'))) { const input = prompt(t('enter_password_verify')); if (input === adminPassword) { onReset(); alert(t('data_wiped')); } } };
  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500 pb-20">
      <header><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('settings')}</h1><p className="text-slate-500">Manage business identity and data backups.</p></header>
      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 space-y-4">
         <div className="flex items-center gap-3 text-blue-700"><ShieldCheck className="w-6 h-6" /><h3 className="text-lg font-extrabold">Security & Access</h3></div>
         <p className="text-blue-600/80 text-sm font-medium">Update administrator password.</p>
         <div className="flex gap-4"><input type="text" placeholder="New Password" className="flex-1 px-4 py-3 bg-white rounded-xl border border-blue-200 outline-none font-bold text-blue-900" value={newPass} onChange={e=>setNewPass(e.target.value)} /><button onClick={()=>{ if(newPass) { onChangePassword(newPass); alert('Updated!'); setNewPass(''); } }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95">{t('update_password')}</button></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-slate-100">
            {/* Logo Section */}
            <div className="flex flex-col items-center sm:items-start gap-2">
                 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Company Logo</label>
                 <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 relative overflow-hidden group cursor-pointer shrink-0">{settings.logo ? <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-2" /> : <ImageIcon className="w-8 h-8 opacity-20" />}<div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold"><Plus className="w-4 h-4 mb-1" /><span>{settings.logo ? 'CHANGE' : 'UPLOAD'}</span></div><input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" /></div>
            </div>

            {/* Signature Upload UI */}
            <div className="flex flex-col items-center sm:items-start gap-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Digital Signature</label>
              <div onClick={() => sigInputRef.current?.click()} className="w-48 h-24 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 relative overflow-hidden group cursor-pointer shrink-0">
                {settings.signature ? <img src={settings.signature} alt="Signature" className="w-full h-full object-contain p-2" /> : <Pencil className="w-8 h-8 opacity-20" />}
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold"><Plus className="w-4 h-4 mb-1" /><span>{settings.signature ? 'CHANGE' : 'UPLOAD'}</span></div>
                <input type="file" ref={sigInputRef} onChange={handleSignatureUpload} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left"><h3 className="text-xl font-extrabold text-slate-900">{settings.name || "Business Name"}</h3><p className="text-sm text-slate-500 font-medium">Your identity on all generated PDF documents.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Legal Name</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SSM Number</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={settings.ssmNumber} onChange={e => setSettings({...settings, ssmNumber: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SST ID</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={settings.sstRegNo} onChange={e => setSettings({...settings, sstRegNo: e.target.value})} /></div>
            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Address</label><textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold h-24 resize-none" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} /></div>
          </div>
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h3 className="text-xl font-extrabold text-slate-900">Banking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Bank Name</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Account Number</label><input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={settings.bankAccount} onChange={e => setSettings({...settings, bankAccount: e.target.value})} /></div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end"><button onClick={() => onSave(settings)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-extrabold hover:bg-slate-800 transition-all shadow-lg active:scale-95">{t('save')}</button></div>
      </div>
      <div className="bg-rose-50 rounded-2xl p-8 border border-rose-100 space-y-4">
        <div className="flex items-center gap-3 text-rose-600"><AlertCircle className="w-6 h-6" /><h3 className="text-lg font-extrabold">Danger Zone</h3></div>
        <p className="text-rose-700 text-sm font-medium">Manage backups or reset system.</p>
        <div className="flex flex-wrap gap-4"><button onClick={onExport} className="px-6 py-2.5 bg-white border border-rose-200 text-rose-700 font-bold rounded-xl shadow-sm hover:bg-rose-50 transition-colors">{t('backup_data')}</button><button onClick={() => importInputRef.current?.click()} className="px-6 py-2.5 bg-white border border-blue-200 text-blue-700 font-bold rounded-xl shadow-sm hover:bg-blue-50 transition-colors">{t('restore_data')}</button><input type="file" ref={importInputRef} onChange={handleFileImport} className="hidden" accept=".json" /><button onClick={handleSafeReset} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all shadow-lg active:scale-95">{t('factory_reset')}</button></div>
      </div>
    </div>
  );
};

const Customers = ({ state, onAdd, onUpdate, onDelete, lang }: { state: AppState, onAdd: (c: Customer) => void, onUpdate: (c: Customer) => void, onDelete: (id: string) => void, lang: Lang }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newC, setNewC] = useState<Partial<Customer>>({});
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('contact_directory')}</h1><p className="text-slate-500">Manage business contacts.</p></div><button onClick={() => { setNewC({}); setIsAdding(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5" /> {t('new_contact')}</button></header>
      {isAdding && (<div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300"><h3 className="text-xl font-extrabold">{newC.id ? t('edit') : t('new_contact')}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Name</label><input placeholder="Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newC.name || ''} onChange={e => setNewC({...newC, name: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Attn</label><input placeholder="Attn" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newC.attentionTo || ''} onChange={e => setNewC({...newC, attentionTo: e.target.value})} /></div><div className="md:col-span-2 space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Address</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold h-24 resize-none" value={newC.address || ''} onChange={e => setNewC({...newC, address: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newC.email || ''} onChange={e => setNewC({...newC, email: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newC.phone || ''} onChange={e => setNewC({...newC, phone: e.target.value})} /></div></div><div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><button onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 font-bold">{t('discard')}</button><button onClick={() => { if(!newC.name) return; if (newC.id) onUpdate(newC as Customer); else onAdd({...newC as Customer, id: Math.random().toString(36).substr(2, 9)}); setIsAdding(false); }} className="px-8 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl">{t('save')}</button></div></div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{state.customers.map(c => (<div key={c.id} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"><div className="flex justify-between items-start mb-6"><div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-extrabold text-lg shadow-lg">{c.name.charAt(0)}</div><div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"><button onClick={() => { setNewC(c); setIsAdding(true); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(c.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></div><h3 className="font-extrabold text-slate-900 text-lg mb-1 leading-tight">{c.name}</h3>{c.attentionTo && <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-4">ATTN: {c.attentionTo}</div>}<p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[2.5rem] leading-relaxed">{c.address}</p></div>))}</div>
    </div>
  );
};

const Products = ({ state, onAdd, onUpdate, onDelete, lang }: { state: AppState, onAdd: (p: Product) => void, onUpdate: (p: Product) => void, onDelete: (id: string) => void, lang: Lang }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newP, setNewP] = useState<Partial<Product>>({});
    const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500"><header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('product_catalog')}</h1><p className="text-slate-500">Manage products.</p></div><button onClick={() => { setNewP({}); setIsAdding(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5" /> {t('new_product')}</button></header>
        {isAdding && (<div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300"><h3 className="text-xl font-extrabold">{newP.id ? t('edit') : t('new_product')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Name</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newP.name || ''} onChange={e => setNewP({...newP, name: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Price</label><input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={newP.price || ''} onChange={e => setNewP({...newP, price: parseFloat(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tax %</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={newP.taxRate !== undefined ? newP.taxRate : 0} onChange={e => setNewP({...newP, taxRate: parseFloat(e.target.value)})}>
                <option value={0}>0%</option><option value={0.05}>5%</option><option value={0.06}>6%</option><option value={0.08}>8%</option><option value={0.10}>10%</option>
            </select></div>
            <div className="md:col-span-3 space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold h-24 resize-none" value={newP.description || ''} onChange={e => setNewP({...newP, description: e.target.value})} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><button onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 font-bold">{t('discard')}</button><button onClick={() => { if(!newP.name) return; if (newP.id) onUpdate(newP as Product); else onAdd({...newP as Product, id: Math.random().toString(36).substr(2, 9), price: newP.price || 0, taxRate: newP.taxRate || 0}); setIsAdding(false); }} className="px-8 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl">{t('save')}</button></div></div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(state.products || []).map(p => (<div key={p.id} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-extrabold text-lg"><Package className="w-6 h-6" /></div><div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"><button onClick={() => { setNewP(p); setIsAdding(true); }} className="p-2 text-slate-300 hover:text-blue-500 rounded-lg"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div><h3 className="font-extrabold text-slate-900 text-lg mb-1 leading-tight">{p.name}</h3><div className="flex items-center gap-2 mb-4"><p className="text-2xl font-black text-slate-900">{formatCurrency(p.price)}</p>{p.taxRate !== undefined && p.taxRate > 0 && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{(p.taxRate * 100).toFixed(0)}% Tax</span>}</div><p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[2.5rem] leading-relaxed mt-2">{p.description || 'No description.'}</p></div>))}</div>
      </div>
    );
};

const WorkflowStage = ({ title, icon, docs, state, onConvert, onUpdateStatus, targetType, actionLabel }: { title: string, icon: React.ReactNode, docs: Document[], state: AppState, onConvert: (doc: Document, to: DocType) => void, onUpdateStatus: (id: string, status: Document['status']) => void, targetType?: DocType, actionLabel?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
    <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-extrabold flex items-center gap-2 text-slate-800 uppercase tracking-tight">{icon}{title}</h3><span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{docs.length}</span></div>
    <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] no-scrollbar pr-1">{docs.length > 0 ? docs.map(doc => {
          const customer = state.customers.find(c => c.id === doc.customerId);
          const total = calculateGrandTotal(doc);
          return (<div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-emerald-300 transition-all shadow-sm flex flex-col gap-3"><div className="flex justify-between items-start"><div className="min-w-0"><p className="font-black text-slate-900">{doc.number}</p><p className="text-xs text-slate-500 truncate font-medium">{customer?.name}</p></div><p className="text-sm font-black text-slate-800">{formatCurrency(total)}</p></div><div className="flex flex-wrap gap-2 pt-2">{targetType && actionLabel && ( <button onClick={() => onConvert(doc, targetType)} className="flex-1 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 shadow-sm">{actionLabel} <ArrowRight className="w-3 h-3" /></button>)}</div></div>);
      }) : <div className="flex flex-col items-center justify-center py-12 text-slate-300 opacity-50"><Clock className="w-10 h-10 mb-2" /><p className="text-xs font-black uppercase tracking-widest">Queue Empty</p></div>}</div>
  </div>
);

const Layout = ({ children, onLogout, lang, setLang }: { children?: React.ReactNode, onLogout: () => void, lang: Lang, setLang: (l: Lang) => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={onLogout} lang={lang} setLang={setLang} />
      <main className="flex-1 overflow-y-auto max-h-screen no-scrollbar relative">
        <div className="lg:hidden px-4 pt-[env(safe-area-inset-top)] pb-3 sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 flex justify-between items-center no-print shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">TF</div>
            <span className="font-bold tracking-tight text-slate-900">Techfab</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-3.5 -mr-2 text-slate-600 active:bg-slate-200 rounded-full transition-colors"><Menu className="w-6.5 h-6.5" /></button>
        </div>
        <div className="p-6 lg:px-10 lg:py-10 max-w-[1600px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminPassword, setAdminPassword] = useLocalStorage('techfab_admin_pwd', 'admin'); 
  const [lang, setLang] = useLocalStorage<Lang>('techfab_lang', 'en');
  const [systemId] = useState(() => {
      const stored = localStorage.getItem('techfab_sys_id');
      if (stored) return stored;
      const newId = 'TF-' + Math.floor(1000 + Math.random() * 9000); 
      localStorage.setItem('techfab_sys_id', newId);
      return newId;
  });
  const [isActivated, setIsActivated] = useLocalStorage('techfab_license_active', false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [state, setState] = useLocalStorage<AppState>('techfab_billing_db_v1', { documents: [], customers: DEFAULT_CUSTOMERS, products: DEFAULT_PRODUCTS, settings: DEFAULT_SETTINGS, lastBackupDate: '' });
  const handleSaveDoc = (doc: Document) => { setState(prev => { const exists = prev.documents.some(d => d.id === doc.id); return exists ? { ...prev, documents: prev.documents.map(d => d.id === doc.id ? doc : d) } : { ...prev, documents: [doc, ...prev.documents] }; }); };
  const handleUpdateDocStatus = (id: string, status: Document['status']) => { setState(prev => ({ ...prev, documents: prev.documents.map(d => d.id === id ? { ...d, status } : d) })); };
  const handleDeleteDoc = (id: string) => { if (window.confirm('Erase this record?')) { setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) })); } };
  const handleConvertDoc = (doc: Document, toType: DocType) => { const nextNum = getNextDocNumber(state.documents, toType, DOC_META[toType].prefix); const newDoc: Document = { ...doc, id: Math.random().toString(36).substr(2, 9), type: toType, number: nextNum, date: new Date().toISOString().split('T')[0], status: 'Draft', notes: `Ref: ${doc.number}${doc.notes ? '\n' + doc.notes : ''}` }; setState(prev => ({ ...prev, documents: [newDoc, ...prev.documents.map(d => d.id === doc.id ? { ...d, status: 'Converted' } : d)] })); alert(`Converted to ${DOC_META[toType].label}.`); };
  const handleResetData = () => { Preferences.clear(); setState({ documents: [], customers: DEFAULT_CUSTOMERS, products: DEFAULT_PRODUCTS, settings: DEFAULT_SETTINGS, lastBackupDate: '' }); window.location.reload(); };
  
  const handleExportData = async () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const fileName = `techfab_backup_${new Date().toISOString().split('T')[0]}.json`;
      if (Capacitor.isNativePlatform()) {
        const base64Data = btoa(unescape(encodeURIComponent(dataStr))); 
        const savedFile = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
        await Share.share({ title: 'Techfab Backup', text: 'Backup file', url: savedFile.uri });
      } else {
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();
      }
      
      // ✅ 导出成功后更新备份日期
      setState(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
      
    } catch (err) { alert("Export failed."); }
  };

  const handleImportData = (file: File) => { const reader = new FileReader(); reader.onload = (e) => { try { const importedState = JSON.parse(e.target?.result as string) as AppState; if (confirm("Restore?")) { setState(importedState); alert("Restored!"); } } catch (err) { alert("Failed."); } }; reader.readAsText(file); };
  const handleActivate = () => { if (licenseKeyInput === generateValidKey(systemId)) { setIsActivated(true); alert('Activated!'); } };
  const handleLogout = () => { setIsAuthenticated(false); setPasswordInput(''); };

  if (!isActivated) return ( <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6"><div className="max-w-md w-full bg-white rounded-[2rem] p-10 text-center space-y-6 shadow-2xl"><div className="mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center"><Lock className="text-rose-500 w-8 h-8"/></div><div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Activation Required</h1></div><div className="bg-slate-50 p-5 rounded-2xl border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">System ID</p><p className="font-mono text-3xl font-black text-slate-900 select-all tracking-wider">{systemId}</p></div><div className="space-y-4"><input type="text" placeholder="LICENSE KEY" className="w-full text-center px-4 py-4 bg-white border-2 border-slate-200 rounded-xl font-black text-xl outline-none" value={licenseKeyInput} onChange={e=>setLicenseKeyInput(e.target.value)} /><button onClick={handleActivate} className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all shadow-xl">Unlock</button></div></div></div>);
  if (!isAuthenticated) return ( <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6"><div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-10 animate-in zoom-in-95 duration-500"><div className="text-center space-y-4"><div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-extrabold text-white text-3xl">TF</div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Techfab Vault</h1></div><div className="space-y-6"><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-lg" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && passwordInput === adminPassword && setIsAuthenticated(true)} /></div><button onClick={() => { if (passwordInput === adminPassword) setIsAuthenticated(true); else alert('Denied.'); }} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-xl">Authorize</button></div></div></div>);

  return (
    <HashRouter>
      <Layout onLogout={handleLogout} lang={lang} setLang={setLang}>
        <Routes>
          <Route path="/" element={<Dashboard state={state} lang={lang} />} />
          <Route path="/documents" element={<DocumentsList state={state} onDelete={handleDeleteDoc} onConvert={handleConvertDoc} lang={lang} />} />
          <Route path="/documents/new" element={<DocumentForm state={state} onSave={handleSaveDoc} lang={lang} />} />
          <Route path="/documents/:id/edit" element={<DocumentForm state={state} onSave={handleSaveDoc} lang={lang} />} />
          <Route path="/products" element={<Products state={state} onAdd={p => setState({...state, products: [...(state.products || []), p]})} onUpdate={updatedP => setState({...state, products: state.products.map(p => p.id === updatedP.id ? updatedP : p)})} onDelete={id => setState({...state, products: state.products.filter(p => id !== p.id)})} lang={lang} />} />
          <Route path="/customers" element={<Customers state={state} onAdd={c => setState({...state, customers: [...state.customers, c]})} onUpdate={updatedC => setState({...state, customers: state.customers.map(c => c.id === updatedC.id ? updatedC : c)})} onDelete={id => setState({...state, customers: state.customers.filter(c => id !== c.id)})} lang={lang} />} />
          <Route path="/settings" element={<Settings state={state} onSave={s => { setState({...state, settings: s}); alert('Profile updated.'); }} onReset={handleResetData} onExport={handleExportData} onImport={handleImportData} onChangePassword={setAdminPassword} lang={lang} adminPassword={adminPassword} />} />
          
          <Route path="/workflow" element={
            <div className="space-y-8 pb-20">
              <header>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{TRANSLATIONS[lang].billing_lifecycle}</h1>
                <p className="text-slate-500 font-medium">Operational funnel tracking from sales to fulfillment.</p>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <WorkflowStage title={TRANSLATIONS[lang].stage_sales} icon={<FileText className="text-blue-500 w-5 h-5" />} docs={state.documents.filter(d => (d.type === DocType.QUOTATION || d.type === DocType.PROFORMA) && d.status !== 'Converted' && d.status !== 'Cancelled')} state={state} onConvert={handleConvertDoc} onUpdateStatus={handleUpdateDocStatus} targetType={DocType.DELIVERY_ORDER} actionLabel="Generate DO" />
                <WorkflowStage title={TRANSLATIONS[lang].stage_fulfill} icon={<Truck className="text-purple-500 w-5 h-5" />} docs={state.documents.filter(d => d.type === DocType.DELIVERY_ORDER && d.status !== 'Converted' && d.status !== 'Cancelled')} state={state} onConvert={handleConvertDoc} onUpdateStatus={handleUpdateDocStatus} targetType={DocType.INVOICE} actionLabel="Generate Invoice" />
                <WorkflowStage title={TRANSLATIONS[lang].stage_billing} icon={<Receipt className="text-emerald-500 w-5 h-5" />} docs={state.documents.filter(d => d.type === DocType.INVOICE && d.status !== 'Cancelled')} state={state} onConvert={handleConvertDoc} onUpdateStatus={handleUpdateDocStatus} />
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;