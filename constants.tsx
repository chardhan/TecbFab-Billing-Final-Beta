import React from 'react';
import { 
  FileText, Users, Settings, LayoutDashboard, Receipt, Truck, FileSpreadsheet, ArrowRightLeft
} from 'lucide-react';
import { DocType } from './types';

export const SST_RATE = 0.08;

export const DOC_META = {
  [DocType.QUOTATION]: {
    label: 'Quotation',
    color: 'bg-blue-100 text-blue-700',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    prefix: 'QT'
  },
  [DocType.INVOICE]: {
    label: 'Invoice',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <Receipt className="w-5 h-5" />,
    prefix: 'INV'
  },
  [DocType.PROFORMA]: {
    label: 'Pro Forma Invoice',
    color: 'bg-amber-100 text-amber-700',
    icon: <FileText className="w-5 h-5" />,
    prefix: 'PI'
  },
  [DocType.DELIVERY_ORDER]: {
    label: 'Delivery Order',
    color: 'bg-purple-100 text-purple-700',
    icon: <Truck className="w-5 h-5" />,
    prefix: 'DO'
  }
};

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard /> },
  { label: 'Documents', path: '/documents', icon: <FileText /> },
  { label: 'Customers', path: '/customers', icon: <Users /> },
  { label: 'Workflow', path: '/workflow', icon: <ArrowRightLeft /> },
  { label: 'Settings', path: '/settings', icon: <Settings /> },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export const amountToWords = (amount: number): string => {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const thousands = ["", "THOUSAND", "MILLION", "BILLION"];

  const helper = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " AND " + helper(n % 100) : "");
  };

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = "";
  let i = 0;
  let tempInt = integerPart;

  if (tempInt === 0) {
    result = "ZERO";
  } else {
    while (tempInt > 0) {
      if (tempInt % 1000 !== 0) {
        result = helper(tempInt % 1000) + (thousands[i] ? " " + thousands[i] : "") + (result ? " " + result : "");
      }
      tempInt = Math.floor(tempInt / 1000);
      i++;
    }
  }

  let words = 'RINGGIT MALAYSIA: ' + result;
  if (decimalPart > 0) {
    words += ' AND CENTS ' + helper(decimalPart);
  }
  return words + ' ONLY';
};