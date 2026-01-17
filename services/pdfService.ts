import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Customer, CompanySettings, DocType } from '../types';
import { formatCurrency, amountToWords, DOC_META } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

const safeStr = (val: any, fallback: string = ''): string => {
  if (val === null || val === undefined) return fallback;
  return String(val);
};

const formatDisplayDate = (dateStr: string) => {
  const d = safeStr(dateStr);
  if (d && d.includes('-')) {
    const parts = d.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return d;
};

export const generateDocumentPDF = async (doc: Document, customer: Customer, settings: CompanySettings) => {
  const docPdf = new jsPDF();
  const meta = DOC_META[doc.type] || DOC_META[DocType.INVOICE];
  const isDO = doc.type === DocType.DELIVERY_ORDER;

  // --- 1. Header & Logo ---
  let headerStartY = 20;
  if (settings.logo) {
    try {
      docPdf.addImage(settings.logo, 'PNG', 20, 10, 25, 20, undefined, 'FAST');
      headerStartY = 35;
    } catch (e) { console.error("Logo error", e); }
  }

  docPdf.setFontSize(22).setFont('helvetica', 'bold').text(meta.label.toUpperCase(), 20, headerStartY);
  docPdf.setFontSize(9).setFont('helvetica', 'normal').text(settings.name, 125, 15);
  docPdf.text(settings.address, 125, 20, { maxWidth: 65 });
  docPdf.text(`SSM: ${settings.ssmNumber}`, 125, 32);
  docPdf.text(`SST: ${settings.sstRegNo}`, 125, 36);
  docPdf.text(`Tel: ${settings.phone}`, 125, 40);

  // --- 2. Doc Meta & Recipient ---
  docPdf.setDrawColor(200).line(20, 45, 190, 45);
  docPdf.setFontSize(9).setFont('helvetica', 'bold').text(isDO ? 'DELIVER TO:' : 'BILL TO:', 20, 52);
  docPdf.setFont('helvetica', 'normal').text(customer.name, 20, 57);
  docPdf.text(customer.address, 20, 62, { maxWidth: 80 });
  if (customer.attentionTo) docPdf.text(`Attn: ${customer.attentionTo}`, 20, 75);

  const metaX = 125;
  docPdf.setFont('helvetica', 'bold').text(`${meta.label} No:`, metaX, 52);
  docPdf.setFont('helvetica', 'normal').text(doc.number, metaX + 35, 52);
  docPdf.setFont('helvetica', 'bold').text('Date:', metaX, 57);
  docPdf.setFont('helvetica', 'normal').text(formatDisplayDate(doc.date), metaX + 35, 57);

  // --- 3. Table ---
  const tableData = doc.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity,
    formatCurrency(item.unitPrice).replace('MYR ', ''),
    `${(item.taxRate || 0) * 100}%`,
    formatCurrency(item.quantity * item.unitPrice).replace('MYR ', '')
  ]);

  autoTable(docPdf, {
    startY: 85,
    head: [['#', 'Description', 'Qty', 'U.Price', 'Tax', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 15 }, 3: { cellWidth: 25 }, 4: { cellWidth: 15 }, 5: { cellWidth: 25 } }
  });

  // --- 4. Summary ---
  let finalY = (docPdf as any).lastAutoTable.finalY + 10;
  const subtotal = doc.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const tax = doc.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0)), 0);
  const discount = doc.discount || 0;
  const total = subtotal + tax - discount;

  if (finalY > 240) { docPdf.addPage(); finalY = 20; }

  const summaryX = 130;
  docPdf.setFontSize(8).setFont('helvetica', 'normal');
  if (!isDO) {
    docPdf.text('Subtotal:', summaryX, finalY);
    docPdf.text(formatCurrency(subtotal), 190, finalY, { align: 'right' });
    docPdf.text('Tax Amount:', summaryX, finalY + 5);
    docPdf.text(formatCurrency(tax), 190, finalY + 5, { align: 'right' });
    if (discount > 0) {
      docPdf.text('Discount:', summaryX, finalY + 10);
      docPdf.text(`-${formatCurrency(discount)}`, 190, finalY + 10, { align: 'right' });
      finalY += 5;
    }
    docPdf.setFont('helvetica', 'bold').setFontSize(10);
    docPdf.text('TOTAL PAYABLE:', summaryX, finalY + 12);
    docPdf.text(formatCurrency(total), 190, finalY + 12, { align: 'right' });
    
    docPdf.setFontSize(7).setFont('helvetica', 'italic');
    docPdf.text(`Say: ${amountToWords(total)} Only`, 20, finalY + 12);
  }

  // --- 5. Footer (Notes & Signatures) ---
  let sigY = finalY + (isDO ? 10 : 30);
  if (sigY > 245) { docPdf.addPage(); sigY = 30; }

  if (doc.notes) {
    docPdf.setFontSize(8).setFont('helvetica', 'bold').text('REMARKS/TERMS:', 20, sigY - 15);
    docPdf.setFont('helvetica', 'normal').text(doc.notes, 20, sigY - 10, { maxWidth: 100 });
  }

  docPdf.setFontSize(9).setFont('helvetica', 'bold');
  if (isDO || doc.type === DocType.QUOTATION) {
    docPdf.text(isDO ? 'RECEIVED BY:' : 'ACCEPTED BY:', 20, sigY);
    docPdf.line(20, sigY + 25, 85, sigY + 25); 
    docPdf.setFont('helvetica', 'normal').setFontSize(7);
    docPdf.text(isDO ? 'Authorized Signature & Stamp' : 'Authorized Signature & Chop', 20, sigY + 30);
    docPdf.text('Name / Date:', 20, sigY + 34);
  }

  if (!isDO && doc.type !== DocType.QUOTATION) {
     docPdf.text('PAYMENT INFO:', 20, sigY);
     docPdf.setFont('helvetica', 'normal').setFontSize(8);
     docPdf.text(`Bank: ${settings.bankName}`, 20, sigY + 5);
     docPdf.text(`Acc No: ${settings.bankAccount}`, 20, sigY + 10);
  }

  // 修改：ISSUED BY 部分，如果设置中有签名图片则渲染
  docPdf.setFont('helvetica', 'bold').setFontSize(9).text('ISSUED BY:', 125, sigY);
  
  // 核心修改：在此处渲染电子签名
  if (settings.signature) {
    try {
      // 这里的坐标 135, sigY+2, 40, 20 是微调后的签名位置
      docPdf.addImage(settings.signature, 'PNG', 135, sigY + 2, 40, 20, undefined, 'FAST');
    } catch (e) { console.error("Signature image error", e); }
  }

  docPdf.line(125, sigY + 25, 190, sigY + 25);
  docPdf.setFont('helvetica', 'normal').setFontSize(7).text(settings.name, 125, sigY + 30);

  // --- 6. Save/Open ---
  const fileName = `${doc.type}_${doc.number.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
  if (Capacitor.isNativePlatform()) {
    const base64 = docPdf.output('datauristring').split(',')[1];
    const path = `Download/${fileName}`;
    try {
      await Filesystem.writeFile({ path, data: base64, directory: Directory.ExternalStorage });
      await FileOpener.open({ filePath: `${Directory.ExternalStorage}/${path}`, contentType: 'application/pdf' });
    } catch (e) {
      const fallback = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await FileOpener.open({ filePath: fallback.uri, contentType: 'application/pdf' });
    }
  } else {
    docPdf.save(fileName);
  }
};