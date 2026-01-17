import { ReactNode } from 'react';

export enum DocType {
  QUOTATION = 'QT',
  INVOICE = 'INV',
  PROFORMA = 'PI',
  DELIVERY_ORDER = 'DO'
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; 
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  taxRate?: number; // ✅ 新增：支持产品单独设置税率
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  attentionTo?: string;
  tin?: string;
  brn?: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  ssmNumber: string;
  sstRegNo: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  sstRate: number;
  logo?: string;
}

export interface Document {
  id: string;
  type: DocType;
  isDeleted?: boolean;
  number: string;
  date: string;
  customerId: string;
  items: LineItem[];
  status: 'Draft' | 'Sent' | 'Paid' | 'Converted' | 'Cancelled';
  discount: number;
  notes?: string;
}

export interface AppState {
  documents: Document[];
  customers: Customer[];
  products: Product[];
  settings: CompanySettings;
}