import React, { useEffect } from "react";
import { X, Download } from "lucide-react";

// Modal de pré-visualização do PDF — mostra o documento antes de baixar.
export default function PDFPreviewModal({ pdfUrl, fileName, onClose }) {
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!pdfUrl) return null;

  const baixar = () => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = fileName || "proposta.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col dark:bg-slate-900">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pré-visualização da Proposta</h3>
          <div className="flex items-center gap-2">
            <button onClick={baixar} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
              <Download size={16} /> Baixar PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <iframe src={pdfUrl} title="Pré-visualização do PDF" className="w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}