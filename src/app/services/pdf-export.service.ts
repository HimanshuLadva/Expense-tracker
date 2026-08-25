import { Injectable } from '@angular/core';

export interface PdfExportTransaction {
  date: string | Date;
  categoryName?: string;
  type: string;
  accountName?: string;
  toAccountName?: string;
  narration?: string;
  amount: number;
}

export interface PdfExportContext {
  fromDate: string;
  toDate: string;
  filterLabel: string;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

const PDF_COLORS = {
  primary: [193, 98, 45] as [number, number, number],
  primaryLight: [217, 130, 79] as [number, number, number],
  accent: [75, 123, 78] as [number, number, number],
  accentTint: [232, 240, 231] as [number, number, number],
  destructive: [193, 70, 46] as [number, number, number],
  destructiveTint: [246, 229, 224] as [number, number, number],
  info: [59, 122, 140] as [number, number, number],
  textPrimary: [43, 36, 32] as [number, number, number],
  textSecondary: [107, 98, 89] as [number, number, number],
  textMuted: [156, 146, 132] as [number, number, number],
  surfaceSunken: [233, 225, 211] as [number, number, number],
  white: [255, 255, 255] as [number, number, number]
};

const PAGE_MARGIN = 14;

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  async exportTransactions(transactions: PdfExportTransaction[], context: PdfExportContext): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let cursorY = this.drawHeader(doc, context);
    cursorY = this.drawSummary(doc, context, cursorY);
    this.drawTable(doc, autoTable, transactions, cursorY);
    this.finalizeFooters(doc);

    doc.save(this.buildFilename(context));
  }

  private drawHeader(doc: InstanceType<typeof import('jspdf').default>, context: PdfExportContext): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('ExpenseTracker', PAGE_MARGIN, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text('Transaction Report', PAGE_MARGIN, 25);

    const generatedOn = `Generated on ${this.formatDateForDisplay(new Date())}`;
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(generatedOn, pageWidth - PAGE_MARGIN, 18, { align: 'right' });

    const rangeLabel = this.formatDateRangeLabel(context);
    doc.setFontSize(9);
    doc.text(rangeLabel, pageWidth - PAGE_MARGIN, 24, { align: 'right' });

    doc.setFontSize(9);
    doc.text(`Showing: ${context.filterLabel} transactions`, pageWidth - PAGE_MARGIN, 30, { align: 'right' });

    doc.setDrawColor(...PDF_COLORS.primaryLight);
    doc.setLineWidth(0.6);
    doc.line(PAGE_MARGIN, 34, pageWidth - PAGE_MARGIN, 34);

    return 42;
  }

  private drawSummary(doc: InstanceType<typeof import('jspdf').default>, context: PdfExportContext, startY: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - PAGE_MARGIN * 2;
    const gap = 4;
    const boxWidth = (usableWidth - gap * 3) / 4;
    const boxHeight = 18;
    const net = context.totalIncome - context.totalExpenses;

    const boxes: Array<{ label: string; value: string; fill: [number, number, number]; text: [number, number, number] }> = [
      {
        label: 'Total Transactions',
        value: String(context.transactionCount),
        fill: PDF_COLORS.surfaceSunken,
        text: PDF_COLORS.textPrimary
      },
      {
        label: 'Total Income',
        value: this.formatCurrencyForPdf(context.totalIncome),
        fill: PDF_COLORS.accentTint,
        text: PDF_COLORS.accent
      },
      {
        label: 'Total Expenses',
        value: this.formatCurrencyForPdf(context.totalExpenses),
        fill: PDF_COLORS.destructiveTint,
        text: PDF_COLORS.destructive
      },
      {
        label: 'Net',
        value: this.formatCurrencyForPdf(net),
        fill: net >= 0 ? PDF_COLORS.accentTint : PDF_COLORS.destructiveTint,
        text: net >= 0 ? PDF_COLORS.accent : PDF_COLORS.destructive
      }
    ];

    boxes.forEach((box, index) => {
      const x = PAGE_MARGIN + index * (boxWidth + gap);

      doc.setFillColor(...box.fill);
      doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.textSecondary);
      doc.text(box.label, x + 3, startY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...box.text);
      const valueLines = doc.splitTextToSize(box.value, boxWidth - 6);
      doc.text(valueLines, x + 3, startY + 13);
    });

    return startY + boxHeight + 10;
  }

  private drawTable(
    doc: InstanceType<typeof import('jspdf').default>,
    autoTable: typeof import('jspdf-autotable').default,
    transactions: PdfExportTransaction[],
    startY: number
  ): void {
    const typeColors: Record<string, [number, number, number]> = {
      income: PDF_COLORS.accent,
      expense: PDF_COLORS.destructive,
      transfer: PDF_COLORS.info
    };

    const body = transactions.map(t => [
      this.formatDateForDisplay(t.date),
      t.categoryName || '-',
      this.capitalize(t.type),
      t.accountName || '-',
      t.toAccountName || '-',
      t.narration || '-',
      this.formatCurrencyForPdf(t.amount)
    ]);

    autoTable(doc, {
      startY,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Date', 'Category', 'Type', 'Account', 'To Account', 'Narration', 'Amount']],
      body,
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: PDF_COLORS.textPrimary,
        cellPadding: 2.5,
        overflow: 'ellipsize'
      },
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.surfaceSunken
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 26, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const transaction = transactions[data.row.index];
          if (transaction) {
            data.cell.styles.textColor = typeColors[transaction.type] || PDF_COLORS.textPrimary;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: () => {
        this.drawFooterRule(doc);
      }
    });
  }

  private drawFooterRule(doc: InstanceType<typeof import('jspdf').default>): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...PDF_COLORS.primaryLight);
    doc.setLineWidth(0.4);
    doc.line(PAGE_MARGIN, pageHeight - 14, pageWidth - PAGE_MARGIN, pageHeight - 14);
  }

  private finalizeFooters(doc: InstanceType<typeof import('jspdf').default>): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 9, { align: 'right' });
      doc.text('ExpenseTracker', PAGE_MARGIN, pageHeight - 9);
    }
  }

  private buildFilename(context: PdfExportContext): string {
    if (context.fromDate && context.toDate) {
      return `transactions_${context.fromDate}_to_${context.toDate}.pdf`;
    }
    return 'transactions_export.pdf';
  }

  private formatDateRangeLabel(context: PdfExportContext): string {
    if (!context.fromDate || !context.toDate) {
      return 'All dates';
    }
    return `${this.formatDateStringForDisplay(context.fromDate)} - ${this.formatDateStringForDisplay(context.toDate)}`;
  }

  private formatDateStringForDisplay(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) {
      return dateString;
    }
    const date = new Date(year, month - 1, day);
    return this.formatDateForDisplay(date);
  }

  private formatDateForDisplay(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  private formatCurrencyForPdf(value: number): string {
    // jsPDF's built-in Helvetica font uses WinAnsi encoding, which has no
    // glyph for the Rupee sign (₹) - using "Rs." avoids rendering a
    // broken character in the generated PDF.
    const sign = value < 0 ? '-' : '';
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));
    return `${sign}Rs. ${formatted}`;
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
