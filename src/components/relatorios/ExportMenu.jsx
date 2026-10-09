import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, Printer, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ExportMenu({ onPDF, onCSV }) {
  const [loading, setLoading] = useState(false);
  const pdf = async () => { setLoading(true); await onPDF(); setLoading(false); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="no-print ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar Relatório
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={pdf}><FileText size={14} className="mr-2" /> PDF Executivo</DropdownMenuItem>
        <DropdownMenuItem onClick={onCSV}><FileSpreadsheet size={14} className="mr-2" /> Planilha (Excel / CSV)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}><Printer size={14} className="mr-2" /> Imprimir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}