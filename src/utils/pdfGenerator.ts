
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ProposalWithContact } from '@/components/proposals/types';
import { InvoiceWithContact } from '@/components/invoices/types';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const generateProposalPdf = async (proposal: ProposalWithContact, comments: any[]) => {
  // Create a temporary div to render our PDF content
  const pdfContent = document.createElement('div');
  pdfContent.className = 'pdf-container';
  
  // Set styles for the PDF container
  pdfContent.style.width = '210mm'; // A4 width
  pdfContent.style.padding = '20mm';
  pdfContent.style.backgroundColor = 'white';
  pdfContent.style.fontFamily = 'Arial, sans-serif';
  pdfContent.style.color = '#1A1F2C';
  
  // Build the PDF content HTML
  pdfContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
      <h1 style="font-size: 24px; color: #0c4a6e; margin: 0;">Proposal</h1>
      <p style="margin: 0; color: #8E9196; font-size: 14px;">Created: ${format(new Date(proposal.created_at), 'PPP')}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EBF2F8;">
      <div style="flex: 1;">
        <h2 style="font-size: 20px; margin-bottom: 5px; color: #0c4a6e;">${proposal.title}</h2>
        <h3 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; color: #0c4a6e;">Contact Information</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${proposal.contact?.name || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${proposal.contact?.company || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${proposal.contact?.email || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${proposal.contact?.phone || 'N/A'}</p>
      </div>
      <div style="text-align: right;">
        <div style="background-color: #F1F0FB; padding: 15px; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #8E9196;">Total Amount</p>
          <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #0c4a6e;">${formatCurrency(proposal.amount)}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 16px; margin-bottom: 10px; color: #0c4a6e;">Details</h3>
      ${proposal.due_date ? 
        `<p style="margin: 5px 0;"><strong>Follow-up Date:</strong> ${format(new Date(proposal.due_date), 'PPP')}</p>` : 
        ''}
      ${proposal.notes ? 
        `<div style="margin-top: 15px; padding: 15px; background-color: #F1F0FB; border-radius: 8px;">
          <p style="margin: 0;">${proposal.notes.replace(/\n/g, '<br/>')}</p>
         </div>` : 
        ''}
    </div>
    
    ${comments && comments.length > 0 ? 
      `<div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 10px; color: #0c4a6e;">Comments</h3>
        ${comments.map((comment: any) => `
          <div style="margin-bottom: 15px; padding: 15px; background-color: #F1F0FB; border-radius: 8px;">
            <p style="margin: 0;">${comment.text.replace(/\n/g, '<br/>')}</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #8E9196;">Added on ${format(new Date(comment.created_at), 'PPP')}</p>
          </div>
        `).join('')}
      </div>` : 
      ''}
    
    <div style="margin-top: 50px; text-align: center; color: #8E9196; font-size: 12px; padding-top: 20px; border-top: 1px solid #EBF2F8;">
      Generated with Closevia
    </div>
  `;
  
  // Append to document, render to canvas, then remove
  document.body.appendChild(pdfContent);
  
  // Use html2canvas to render the content
  const canvas = await html2canvas(pdfContent, {
    scale: 1.5, // Higher resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF'
  });
  
  // Remove the temporary element
  document.body.removeChild(pdfContent);
  
  // Create PDF from canvas
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add the image to the PDF (centered)
  const imgWidth = 210; // A4 width in mm
  const imgHeight = canvas.height * imgWidth / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
  // Download the PDF
  pdf.save(`Proposal_${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

export const generateInvoicePdf = async (invoice: InvoiceWithContact, comments: any[]) => {
  // Create a temporary div to render our PDF content
  const pdfContent = document.createElement('div');
  pdfContent.className = 'pdf-container';
  
  // Set styles for the PDF container
  pdfContent.style.width = '210mm'; // A4 width
  pdfContent.style.padding = '20mm';
  pdfContent.style.backgroundColor = 'white';
  pdfContent.style.fontFamily = 'Arial, sans-serif';
  pdfContent.style.color = '#1A1F2C';
  
  // Build the PDF content HTML
  pdfContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
      <h1 style="font-size: 24px; color: #0c4a6e; margin: 0;">Invoice</h1>
      <p style="margin: 0; color: #8E9196; font-size: 14px;">Created: ${format(new Date(invoice.created_at), 'PPP')}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EBF2F8;">
      <div style="flex: 1;">
        <h2 style="font-size: 20px; margin-bottom: 5px; color: #0c4a6e;">${invoice.title}</h2>
        <h3 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; color: #0c4a6e;">Contact Information</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${invoice.contact?.name || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${invoice.contact?.company || 'N/A'}</p>
        <!-- We don't have email and phone in the InvoiceWithContact type, so we omit them -->
      </div>
      <div style="text-align: right;">
        <div style="background-color: #F1F0FB; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0; font-size: 14px; color: #8E9196;">Total Amount</p>
          <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #0c4a6e;">${formatCurrency(invoice.amount)}</p>
        </div>
        ${invoice.due_date ? 
          `<div style="background-color: #F1F0FB; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #8E9196;">Due Date</p>
            <p style="margin: 10px 0 0; font-size: 16px; font-weight: bold; color: #0c4a6e;">${format(new Date(invoice.due_date), 'PPP')}</p>
          </div>` : 
          ''}
      </div>
    </div>
    
    ${invoice.notes ? 
      `<div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 10px; color: #0c4a6e;">Notes</h3>
        <div style="padding: 15px; background-color: #F1F0FB; border-radius: 8px;">
          <p style="margin: 0;">${invoice.notes.replace(/\n/g, '<br/>')}</p>
        </div>
      </div>` : 
      ''}
    
    ${comments && comments.length > 0 ? 
      `<div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 10px; color: #0c4a6e;">Comments</h3>
        ${comments.map((comment: any) => `
          <div style="margin-bottom: 15px; padding: 15px; background-color: #F1F0FB; border-radius: 8px;">
            <p style="margin: 0;">${comment.text.replace(/\n/g, '<br/>')}</p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #8E9196;">Added on ${format(new Date(comment.created_at), 'PPP')}</p>
          </div>
        `).join('')}
      </div>` : 
      ''}

    <div style="margin-top: ${comments && comments.length > 0 ? '30px' : '50px'}; text-align: center; color: #8E9196; font-size: 12px; padding-top: 20px; border-top: 1px solid #EBF2F8;">
      Generated with Closevia
    </div>
  `;
  
  // Append to document, render to canvas, then remove
  document.body.appendChild(pdfContent);
  
  // Use html2canvas to render the content
  const canvas = await html2canvas(pdfContent, {
    scale: 1.5, // Higher resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF'
  });
  
  // Remove the temporary element
  document.body.removeChild(pdfContent);
  
  // Create PDF from canvas
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add the image to the PDF (centered)
  const imgWidth = 210; // A4 width in mm
  const imgHeight = canvas.height * imgWidth / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
  // Download the PDF
  pdf.save(`Invoice_${invoice.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};
