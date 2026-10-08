import React, { useEffect, useRef, useState } from "react";
import { X, Download, Type, Square, MousePointer2, Trash2, Plus, Minus, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

let _seq = 0;
const nid = () => `a${++_seq}`;

// Editor de PDF: adiciona texto, apaga (cobre com retângulo branco) e move/remove anotações.
// As anotações são salvas direto no PDF via pdf-lib.
export default function PdfEditorModal({ pdfBytes, fileName, onClose, onSave }) {
  const [numPages, setNumPages] = useState(0);
  const [pageSizes, setPageSizes] = useState([]); // px no scale atual
  const [scale, setScale] = useState(1.4);
  const [tool, setTool] = useState("text"); // text | erase | select
  const [annots, setAnnots] = useState({}); // { pageNum: [{id,type,x,y,w,h,text,fontSize}] } em pt
  const [selected, setSelected] = useState(null); // { page, id }
  const [fontSize, setFontSize] = useState(11); // pt
  const [focusId, setFocusId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null); // retângulo de apagar em arrasto (pt)
  const canvasRefs = useRef({});
  const pdfDocRef = useRef(null);
  const dragRef = useRef(null); // {mode, page, startPt, offsetPt, id}

  // Carrega o PDF uma vez
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = pdfBytes.slice(0);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível abrir o PDF para edição.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfBytes]);

  // Renderiza as páginas quando muda numPages ou scale
  useEffect(() => {
    if (!numPages) return;
    let cancelled = false;
    (async () => {
      const pdf = pdfDocRef.current;
      if (!pdf) return;
      setLoading(true);
      const sizes = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRefs.current[i];
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        }
        sizes.push({ w: viewport.width, h: viewport.height });
      }
      if (!cancelled) { setPageSizes(sizes); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [numPages, scale]);

  const updateAnnot = (page, id, patch) => {
    setAnnots((a) => ({ ...a, [page]: (a[page] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };
  const addAnnot = (page, annot) => {
    setAnnots((a) => ({ ...a, [page]: [...(a[page] || []), annot] }));
  };
  const removeAnnot = (page, id) => {
    setAnnots((a) => ({ ...a, [page]: (a[page] || []).filter((x) => x.id !== id) }));
    if (selected && selected.page === page && selected.id === id) setSelected(null);
  };

  const ptFromEvent = (e, page) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  const onLayerMouseDown = (e, page) => {
    if (tool === "text") {
      const p = ptFromEvent(e, page);
      const id = nid();
      addAnnot(page, { id, type: "text", x: p.x, y: p.y, w: 0, h: 0, text: "", fontSize });
      setSelected({ page, id });
      setFocusId(id);
    } else if (tool === "erase") {
      const p = ptFromEvent(e, page);
      dragRef.current = { mode: "erase", page, startPt: p };
      setDraft({ page, x: p.x, y: p.y, w: 0, h: 0 });
    } else if (tool === "select") {
      setSelected(null);
    }
  };

  const onLayerMouseMove = (e, page) => {
    const d = dragRef.current;
    if (!d || d.page !== page) return;
    const p = ptFromEvent(e, page);
    if (d.mode === "erase") {
      setDraft({ page, x: Math.min(d.startPt.x, p.x), y: Math.min(d.startPt.y, p.y), w: Math.abs(p.x - d.startPt.x), h: Math.abs(p.y - d.startPt.y) });
    } else if (d.mode === "move" && d.id) {
      updateAnnot(page, d.id, { x: p.x - d.offsetPt.x, y: p.y - d.offsetPt.y });
    }
  };

  const onLayerMouseUp = (e, page) => {
    const d = dragRef.current;
    if (d && d.mode === "erase" && draft && draft.page === page) {
      if (draft.w > 2 && draft.h > 2) addAnnot(page, { id: nid(), type: "erase", ...draft });
      setDraft(null);
    }
    dragRef.current = null;
  };

  const startMove = (e, page, annot) => {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelected({ page, id: annot.id });
    const p = ptFromEvent(e, page);
    dragRef.current = { mode: "move", page, id: annot.id, offsetPt: { x: p.x - annot.x, y: p.y - annot.y } };
  };

  // Salva as anotações no PDF via pdf-lib
  const salvar = async () => {
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes.slice(0));
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      for (const [pnStr, list] of Object.entries(annots)) {
        const pn = Number(pnStr);
        const page = pages[pn - 1];
        if (!page) continue;
        const { height } = page.getSize();
        for (const a of list) {
          if (a.type === "erase") {
            page.drawRectangle({ x: a.x, y: height - a.y - a.h, width: a.w, height: a.h, color: rgb(1, 1, 1) });
          } else if (a.type === "text" && a.text) {
            const lines = a.text.split("\n");
            lines.forEach((ln, idx) => {
              if (ln) page.drawText(ln, { x: a.x, y: height - a.y - a.fontSize - idx * a.fontSize * 1.2, size: a.fontSize, font, color: rgb(0, 0, 0) });
            });
          }
        }
      }
      const out = await pdfDoc.save();
      const bytes = new Uint8Array(out);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      toast.success("Alterações salvas no PDF!");
      onSave(bytes, url);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar o PDF editado.");
    } finally {
      setSaving(false);
    }
  };

  const baixar = () => {
    // Salva e dispara o download
    setSaving(true);
    (async () => {
      try {
        const pdfDoc = await PDFDocument.load(pdfBytes.slice(0));
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        for (const [pnStr, list] of Object.entries(annots)) {
          const pn = Number(pnStr);
          const page = pages[pn - 1];
          if (!page) continue;
          const { height } = page.getSize();
          for (const a of list) {
            if (a.type === "erase") {
              page.drawRectangle({ x: a.x, y: height - a.y - a.h, width: a.w, height: a.h, color: rgb(1, 1, 1) });
            } else if (a.type === "text" && a.text) {
              const lines = a.text.split("\n");
              lines.forEach((ln, idx) => {
                if (ln) page.drawText(ln, { x: a.x, y: height - a.y - a.fontSize - idx * a.fontSize * 1.2, size: a.fontSize, font, color: rgb(0, 0, 0) });
              });
            }
          }
        }
        const out = await pdfDoc.save();
        const bytes = new Uint8Array(out);
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "proposta.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao baixar o PDF.");
      } finally {
        setSaving(false);
      }
    })();
  };

  const ToolBtn = ({ active, onClick, children, title }) => (
    <button onClick={onClick} title={title} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"}`}>{children}</button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mr-2">Editar PDF</span>
        <ToolBtn active={tool === "text"} onClick={() => setTool("text")} title="Adicionar texto"><Type size={16} /> Texto</ToolBtn>
        <ToolBtn active={tool === "erase"} onClick={() => setTool("erase")} title="Apagar (cobre com branco)"><Square size={16} /> Apagar</ToolBtn>
        <ToolBtn active={tool === "select"} onClick={() => setTool("select")} title="Selecionar e mover"><MousePointer2 size={16} /> Selecionar</ToolBtn>

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Fonte</span>
          <button onClick={() => setFontSize((f) => Math.max(7, f - 1))} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Minus size={14} /></button>
          <span className="text-xs font-medium w-7 text-center tabular-nums text-slate-700 dark:text-slate-200">{fontSize}</span>
          <button onClick={() => setFontSize((f) => Math.min(48, f + 1))} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus size={14} /></button>
        </div>

        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Diminuir zoom"><ZoomOut size={16} /></button>
          <span className="text-xs font-medium w-10 text-center tabular-nums text-slate-600 dark:text-slate-300">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)))} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Aumentar zoom"><ZoomIn size={16} /></button>
        </div>

        {selected && (
          <button onClick={() => removeAnnot(selected.page, selected.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">
            <Trash2 size={16} /> Remover
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={baixar} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Download size={16} /> {saving ? "Salvando..." : "Baixar"}
          </button>
          <button onClick={salvar} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
      </div>

      {/* Páginas */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center gap-6">
        {loading && <div className="text-sm text-slate-500 dark:text-slate-400">Carregando páginas...</div>}
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pn) => (
          <div key={pn} className="relative inline-block shadow-lg bg-white" style={{ width: pageSizes[pn - 1]?.w }}>
            <canvas ref={(el) => { canvasRefs.current[pn] = el; }} className="block" />
            {/* Camada de anotações */}
            <div
              className="absolute inset-0"
              style={{ cursor: tool === "erase" ? "crosshair" : tool === "text" ? "text" : "default" }}
              onMouseDown={(e) => onLayerMouseDown(e, pn)}
              onMouseMove={(e) => onLayerMouseMove(e, pn)}
              onMouseUp={(e) => onLayerMouseUp(e, pn)}
            >
              {(annots[pn] || []).map((a) => a.type === "erase" ? (
                <div
                  key={a.id}
                  onMouseDown={(e) => startMove(e, pn, a)}
                  className={`absolute ${selected && selected.page === pn && selected.id === a.id ? "ring-2 ring-primary" : ""}`}
                  style={{ left: a.x * scale, top: a.y * scale, width: a.w * scale, height: a.h * scale, background: "#fff", border: "1px dashed #94a3b8", pointerEvents: tool === "erase" ? "none" : "auto" }}
                />
              ) : (
                <textarea
                  key={a.id}
                  value={a.text}
                  autoFocus={focusId === a.id}
                  onChange={(e) => updateAnnot(pn, a.id, { text: e.target.value })}
                  onMouseDown={(e) => startMove(e, pn, a)}
                  placeholder="digite..."
                  className={`absolute bg-transparent outline-none resize-none p-0 m-0 leading-tight ${selected && selected.page === pn && selected.id === a.id ? "border border-dashed border-primary" : "border border-transparent"}`}
                  style={{ left: a.x * scale, top: a.y * scale, fontSize: a.fontSize * scale, color: "#000", width: 260, minHeight: a.fontSize * scale * 1.2, pointerEvents: tool === "erase" ? "none" : "auto", fontFamily: "Helvetica, Arial, sans-serif" }}
                />
              ))}
              {draft && draft.page === pn && (
                <div className="absolute" style={{ left: draft.x * scale, top: draft.y * scale, width: draft.w * scale, height: draft.h * scale, background: "rgba(255,255,255,0.6)", border: "1px dashed #f97316" }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}