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
    } catch (e) { console.error(e); }
  }

  docPdf.setFontSize(18).setTextColor(30, 41, 59).text(safeStr(settings.name), 20, headerStartY);
  docPdf.setFontSize(8).setTextColor(71, 85, 105).text(`(SSM: ${safeStr(settings.ssmNumber)})`, 20, headerStartY + 5);
  
  if (settings.sstRegNo) {
     docPdf.text(`SST ID: ${safeStr(settings.sstRegNo)}`, 20, headerStartY + 9);
  }

  const addrLines = docPdf.splitTextToSize(safeStr(settings.address), 75);
  docPdf.setFontSize(9).text(addrLines, 20, headerStartY + (settings.sstRegNo ? 14 : 10));
  
  const contactY = headerStartY + (settings.sstRegNo ? 14 : 10) + (addrLines.length * 4);
  docPdf.text(`Tel: ${safeStr(settings.phone)} | Email: ${safeStr(settings.email)}`, 20, contactY);

  // --- 2. Right Side Title ---
  docPdf.setFontSize(22).setTextColor(30, 41, 59).setFont('helvetica', 'bold');
  const title = meta.label.toUpperCase();
  docPdf.text(title, 190, headerStartY + 5, { align: 'right' });

  docPdf.setFontSize(10).setFont('helvetica', 'normal').setTextColor(71, 85, 105);
  docPdf.text(`No:    ${safeStr(doc.number)}`, 190, headerStartY + 15, { align: 'right' });
  docPdf.text(`Date:        ${formatDisplayDate(doc.date)}`, 190, headerStartY + 20, { align: 'right' });

  // --- 3. Recipient Info ---
  docPdf.setFontSize(10).setFont('helvetica', 'bold').setTextColor(30, 41, 59);
  docPdf.text(isDO ? 'DELIVER TO:' : 'BILL TO:', 20, headerStartY + 35);
  docPdf.setFont('helvetica', 'bold').text(safeStr(customer.name), 20, headerStartY + 40);
  docPdf.setFont('helvetica', 'normal'); 
  const custAddrLines = docPdf.splitTextToSize(safeStr(customer.address), 80);
  docPdf.text(custAddrLines, 20, headerStartY + 45);

  let custInfoY = headerStartY + 45 + (custAddrLines.length * 5); 
  let contactLine = '';
  if (customer.attentionTo) contactLine += `Attn: ${safeStr(customer.attentionTo)}`;
  if (customer.phone) {
      if (contactLine) contactLine += '  '; 
      contactLine += `Tel: ${safeStr(customer.phone)}`;
  }
  if (contactLine) {
      docPdf.text(contactLine, 20, custInfoY);
      custInfoY += 5;
  }

  // --- 4. Dynamic Table ---
  const tableStartY = Math.max(85, custInfoY + 10);
  
  const tableHead = isDO 
    ? [['#', 'Description', 'Qty']] 
    : [['#', 'Description', 'Qty', 'Price', 'Tax', 'Total']];

  const tableBody = doc.items.map((item, idx) => {
    if (isDO) {
      return [idx + 1, item.description, item.quantity];
    }
    return [
      idx + 1, 
      item.description, 
      item.quantity, 
      formatCurrency(item.unitPrice),
      `${(item.taxRate * 100).toFixed(0)}%`,
      formatCurrency(item.quantity * item.unitPrice)
    ];
  });

  const tableColStyles = isDO 
    ? {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'center' }
      }
    : {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' }
      };

  autoTable(docPdf, {
    startY: tableStartY, 
    margin: { bottom: 0 }, 
    styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
    head: tableHead,
    body: tableBody,
    theme: 'grid', 
    headStyles: { fillColor: [30, 41, 59], fontSize: 9, minCellHeight: 8 },
    columnStyles: tableColStyles
  });

  // @ts-ignore
  let finalY = docPdf.lastAutoTable.finalY + 8; // 表格结束后的起始高度
  const pageHeight = docPdf.internal.pageSize.getHeight();
  const sigY = pageHeight - 65; 

  // --- ✅ 5. Total QTY 逻辑 (精准显示在 QTY 列下方) ---
  const totalQty = doc.items.reduce((s, i) => s + i.quantity, 0);
  
  // 计算 QTY 列的中心 X 坐标
  // DO: 第3列, 宽度25, 右边界190 -> 中心点 = 190 - (25/2) = 177.5
  // Invoice: 第3列, 宽度15, 位于 # (10) 和 Desc (75) 之后 -> 中心点 = 20 + 10 + 75 + (15/2) = 112.5
  const qtyCenterX = isDO ? 177.5 : 112.5;

  docPdf.setFontSize(9).setFont('helvetica', 'bold').setTextColor(30, 41, 59);
  docPdf.text(`Total Qty: ${totalQty}`, qtyCenterX, finalY, { align: 'center' });
  
  finalY += 8; // 为接下来的内容留出空间

  // --- 6. 金额汇总 (如果是 Invoice) ---
  if (!isDO) {
    const subtotal = doc.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const taxTotal = doc.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0)), 0);
    const grandTotal = subtotal + taxTotal - (doc.discount || 0);

    if (finalY + 35 > sigY - 10) { docPdf.addPage(); finalY = 20; }

    const labelX = 140; 
    const valueX = 190;
    
    docPdf.setFontSize(10).setFont('helvetica', 'normal').setTextColor(71, 85, 105);
    docPdf.text('Subtotal :', labelX, finalY);
    docPdf.text(formatCurrency(subtotal), valueX, finalY, { align: 'right' });
    
    docPdf.text('Tax Total :', labelX, finalY + 7);
    docPdf.text(formatCurrency(taxTotal), valueX, finalY + 7, { align: 'right' });

    if (doc.discount > 0) {
      docPdf.text('Discount :', labelX, finalY + 14);
      docPdf.text(`- ${formatCurrency(doc.discount)}`, valueX, finalY + 14, { align: 'right' });
    }

    docPdf.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 41, 59);
    docPdf.text('TOTAL :', labelX, finalY + 22);
    docPdf.text(formatCurrency(grandTotal), valueX, finalY + 22, { align: 'right' });
    
    docPdf.setFontSize(4).setFont('helvetica', 'bold');
    docPdf.text(amountToWords(grandTotal), 20, finalY + 22);
    
    finalY += 35;
  }

  // --- 7. Footer & Signatures ---
  if (doc.notes) {
    if (finalY > sigY - 10) { docPdf.addPage(); finalY = 20; }
    docPdf.setFontSize(6).setFont('helvetica', 'bold').text('Notes:', 20, finalY);
    const labelWidth = docPdf.getTextWidth('Notes:');
    docPdf.setFont('helvetica', 'normal');
    const contentX = 20 + labelWidth + 1.5; 
    const maxWidth = 190 - contentX;
    const notesLines = docPdf.splitTextToSize(safeStr(doc.notes), maxWidth);
    docPdf.text(notesLines, contentX, finalY);
    finalY += (notesLines.length * 3.5); 
  }

  if (finalY > sigY - 10) docPdf.addPage();

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

  docPdf.setFont('helvetica', 'bold').setFontSize(9).text('ISSUED BY:', 125, sigY);
  docPdf.line(125, sigY + 25, 190, sigY + 25);
  docPdf.setFont('helvetica', 'normal').setFontSize(7).text(settings.name, 125, sigY + 30);

  // --- 📱 保存/打开逻辑 ---
  const fileName = `${doc.type}_${doc.number}.pdf`;
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = docPdf.output('datauristring').split(',')[1];
      const savedFile = await Filesystem.writeFile({ path: fileName, data: pdfBase64, directory: Directory.Documents, recursive: true });
      await FileOpener.open({ filePath: savedFile.uri, contentType: 'application/pdf' });
    } catch (e) { alert('PDF Error: ' + JSON.stringify(e)); }
  } else {
    docPdf.save(fileName);
  }
};