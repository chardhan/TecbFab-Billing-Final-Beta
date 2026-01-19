
import { Document, DocType } from './types';
import { roundTo } from './constants';

export const getNextDocNumber = (docs: Document[], type: DocType, prefix: string) => {
    const currentYear = new Date().getFullYear();
    const yearDocs = docs.filter(d => !d.isDeleted && d.type === type && d.number.includes(`-${currentYear}-`));
    let maxSeq = 0;
    yearDocs.forEach(d => {
        const parts = d.number.split('-');
        const seq = parseInt(parts[parts.length - 1]);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });
    const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
    return `${prefix}-${currentYear}-${nextSeq}`;
};

export const calculateGrandTotal = (doc: Document) => {
    const subtotal = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice), 0);
    const tax = doc.items.reduce((s, i) => s + roundTo(i.quantity * i.unitPrice * (i.taxRate || 0)), 0);
    const total = roundTo(subtotal + tax - (doc.discount || 0));
    return Math.max(0, total);
};

export const generateValidKey = (sysId: string) => {
    const sum = sysId.split('').reduce((acc, char) => {
        const num = parseInt(char);
        return isNaN(num) ? acc : acc + num;
    }, 0);
    return (sum * 888).toString();
};

export const compressBase64 = (base64Str: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
            } else {
                if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
    });
};
