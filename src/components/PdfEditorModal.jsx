import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Download, Type, SquareDashed, MousePointer2, Trash2, Plus, Minus, ZoomIn, ZoomOut, Undo2, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

let _seq = 0;
const nid = () => `a${++_seq}`;

// Editor de PDF: adicionar texto, apagar (cobre com branco), mover e remover anotações.
// Coordenadas das anotações em pontos (pt) do PDF; renderização aplica `scale`.
// Drag de move/erase usa listeners de window para não quebrar quando o cursor sai da camada.
export default function PdfEditorModal({ pdfBytes, fileName, onClose, onSave }) {
  const [numPages, setNumPages] = useState(0);
  const [pageSizes, setPageSizes] = useState([]); // {w,h} em px no scale atual
  const [scale, setScale] = useState(1.4);
  const [tool, setTool] = useState("text"); // text | erase | select
  const [annots, setAnnots] = useState({}); // { pageNum: [{id,type,x,y,w,h,text,fontSize}] } em pt
  const [selected, setSelected] = useState(null); // { page, id }
  const [fontSize, setFontSize] = useState(11); // pt
  const [focusId, setFocusId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null); // retângulo de apagar em arrasto (pt + page)
  const [history, setHistory] = useState([]); // stack de snapshots para desfazer

  const canvasRefs = useRef({});
  const pdfDocRef = useRef(null);
  const dragRef = useRef(null); // {mode, page, startPt, offsetPt, id, moved}
  const layerRefs = useRef({});

  // ── Carrega o PDF uma vez ──────────────────────────────────────────────
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

  // ── Renderiza as páginas quando muda numPages ou scale ─────────────────
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

  // ── Helpers de anotação ────────────────────────────────────────────────
  const snapshot = () => setHistory((h) => [...h.slice(-29), annots]);

  const updateAnnot = (page, id, patch, keepHistory = false) => {
    if (keepHistory) snapshot();
    setAnnots((a) => ({ ...a, [page]: (a[page] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };
  const addAnnot = (page, annot) => {
    snapshot();
    setAnnots((a) => ({ ...a, [page]: [...(a[page] || []), annot] }));
  };
  const removeAnnot = (page, id) => {
    snapshot();
    setAnnots((a) => ({ ...a, [page]: (a[page] || []).filter((x) => x.id !== id) }));
    if (selected && selected.page === page && selected.id === id) setSelected(null);
  };
  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setAnnots(prev);
      setSelected(null);
      return h.slice(0, -1);
    });
  };

  // ── Conversão de coordenadas ────────────────────────────────────────────
  const ptFromEvent = (e, page) => {
    const rect = layerRefs.current[page]?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  // ── Drag global (window) para move e erase ──────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const p = ptFromEvent(e, d.page);
      if (d.mode === "erase") {
        setDraft({ page: d.page, x: Math.min(d.startPt.x, p.x), y: Math.min(d.startPt.y, p.y), w: Math.abs(p.x - d.startPt.x), h: Math.abs(p.y - d.startPt.y) });
      } else if (d.mode === "move" && d.id) {
        d.moved = true;
        updateAnnot(d.page, d.id, { x: Math.max(0, p.x - d.offsetPt.x), y: Math.max(0, p.y - d.offsetPt.y) });
      }
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d && d.mode === "erase" && draftRef.current) {
        const dr = draftRef.current;
        if (dr.w > 2 && dr.h > 2) addAnnot(dr.page, { id: nid(), type: "erase", ...dr });
        setDraft(null);
      }
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []); // draft lido via ref

  const draftRef = useRef(null);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // ── Camada: criar anotação conforme ferramenta ──────────────────────────
  const onLayerPointerDown = (e, page) => {
    if (e.button !== 0) return;
    // text: cria caixa no ponto clicado
    if (tool === "text") {
      const p = ptFromEvent(e, page);
      const id = nid();
      addAnnot(page, { id, type: "text", x: p.x, y: p.y, w: 0, h: 0, text: "", fontSize });
      setSelected({ page, id });
      setFocusId(id);
      return;
    }
    // erase: inicia arrasto
    if (tool === "erase") {
      const p = ptFromEvent(e, page);
      dragRef.current = { mode: "erase", page, startPt: p };
      setDraft({ page, x: p.x, y: p.y, w: 0, h: 0 });
      return;
    }
    // select: clicou no vazio → desseleciona
    if (tool === "select") setSelected(null);
  };

  // ── Anotação: selecionar/mover (sempre para propagação) ──────────────────
  const onAnnotPointerDown = (e, page, annot) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setSelected({ page, id: annot.id });
    if (tool === "erase") return; // em modo apagar, não move
    // text e select permitem mover
    const p = ptFromEvent(e, page);
    dragRef.current = { mode: "move", page, id: annot.id, offsetPt: { x: p.x - annot.x, y: p.y - annot.y }, moved: false };
  };

  // ── Caixa de texto: focar para editar (não cria nova) ────────────────────
  const onTextPointerDown = (e, page, annot) => {
    e.stopPropagation();
    setSelected({ page, id: annot.id });
    // inicia move apenas se tool !== text (em text, só edita)
    if (tool !== "text") {
      const p = ptFromEvent(e, page);
      dragRef.current = { mode: "move", page, id: annot.id, offsetPt: { x: p.x - annot.x, y: p.y - annot.y }, moved: false };
    }
  };

  // ── Teclado: Delete remove selecionado ──────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const t = e.target;
        // não intercepta quando digitando em input/textarea
        if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
        e.preventDefault();
        removeAnnot(selected.page, selected.id);
      }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // ── Salvar anotações no PDF via pdf-lib ──────────────────────────────────
  const buildEdited = async () => {
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
          const lines = String(a.text).split("\n");
          lines.forEach((ln, idx) => {
            if (ln) page.drawText(ln, { x: a.x, y: height - a.y - a.fontSize - idx * a.fontSize * 1.2, size: a.fontSize, font, color: rgb(0, 0, 0) });
          });
        }
      }
    }
    const out = await pdfDoc.save();
    return new Uint8Array(out);
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const bytes = await buildEdited();
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

  const baixar = async () => {
    setSaving(true);
    try {
      const bytes = await buildEdited();
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
  };

  const limpar = () => {
    if (!confirm("Remover todas as anotações de todas as páginas?")) return;
    snapshot();
    setAnnots({});
    setSelected(null);
  };

  const ToolBtn = ({ active, onClick, children, title }) => (
    <button onClick={onClick} title={title} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"}`}>{children}</button>
  );

  const cursorFor = tool === "erase" ? "crosshair" : tool === "text" ? "text" : "default";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mr-1">Editar PDF</span>
        <ToolBtn active={tool === "text"} onClick={() => setTool("text")} title="Adicionar / editar texto"><Type size={16} /> Texto</ToolBtn>
        <ToolBtn active={tool === "erase"} onClick={() => setTool("erase")} title="Apagar (cobre com branco)"><SquareDashed size={16} /> Apagar</ToolBtn>
        <ToolBtn active={tool === "select"} onClick={() => setTool("select")} title="Selecionar e mover"><MousePointer2 size={16} /> Mover</ToolBtn>

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

        <button onClick={undo} disabled={!history.length} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800" title="Desfazer"><Undo2 size={16} /> Desfazer</button>

        {selected && (
          <button onClick={() => removeAnnot(selected.page, selected.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">
            <Trash2 size={16} /> Remover
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button onClick={limpar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800" title="Limpar tudo"><RotateCcw size={16} /> Limpar</button>
          <button onClick={baixar} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Download size={16} /> {saving ? "Salvando..." : "Baixar"}
          </button>
          <button onClick={salvar} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
      </div>

      {/* Dica de uso */}
      <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-300">
        {tool === "text" && "Clique no documento para inserir texto · clique numa caixa para editar · arraste no modo Mover para reposicionar"}
        {tool === "erase" && "Arraste sobre o que deseja apagar — um retângulo branco cobre a área"}
        {tool === "select" && "Clique numa anotação para selecioná-la · arraste para mover · Delete para remover"}
      </div>

      {/* Páginas */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center gap-6">
        {loading && <div className="text-sm text-slate-500 dark:text-slate-400">Carregando páginas...</div>}
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pn) => (
          <div key={pn} className="relative inline-block shadow-lg bg-white" style={{ width: pageSizes[pn - 1]?.w }}>
            <canvas ref={(el) => { canvasRefs.current[pn] = el; }} className="block" />
            {/* Camada de anotações */}
            <div
              ref={(el) => { layerRefs.current[pn] = el; }}
              className="absolute inset-0"
              style={{ cursor: cursorFor, touchAction: "none" }}
              onPointerDown={(e) => onLayerPointerDown(e, pn)}
            >
              {(annots[pn] || []).map((a) => a.type === "erase" ? (
                <div
                  key={a.id}
                  onPointerDown={(e) => onAnnotPointerDown(e, pn, a)}
                  className={`absolute ${selected && selected.page === pn && selected.id === a.id ? "ring-2 ring-primary" : "ring-1 ring-slate-400/40"}`}
                  style={{ left: a.x * scale, top: a.y * scale, width: a.w * scale, height: a.h * scale, background: "#fff", border: "1px dashed #94a3b8", pointerEvents: tool === "erase" ? "none" : "auto" }}
                />
              ) : (
                <textarea
                  key={a.id}
                  value={a.text}
                  autoFocus={focusId === a.id}
                  onChange={(e) => updateAnnot(pn, a.id, { text: e.target.value })}
                  onPointerDown={(e) => onTextPointerDown(e, pn, a)}
                  onFocus={() => setSelected({ page: pn, id: a.id })}
                  placeholder="digite..."
                  className={`absolute bg-transparent outline-none resize-none p-0 m-0 leading-tight overflow-hidden ${selected && selected.page === pn && selected.id === a.id ? "border border-dashed border-primary" : "border border-transparent"}`}
                  style={{ left: a.x * scale, top: a.y * scale, fontSize: a.fontSize * scale, color: "#000", width: 280, minHeight: a.fontSize * scale * 1.3, pointerEvents: tool === "erase" ? "none" : "auto", fontFamily: "Helvetica, Arial, sans-serif" }}
                />
              ))}
              {draft && draft.page === pn && (
                <div className="absolute pointer-events-none" style={{ left: draft.x * scale, top: draft.y * scale, width: draft.w * scale, height: draft.h * scale, background: "rgba(255,255,255,0.65)", border: "1.5px dashed #f97316" }} />
              )}
            </div>
            <span className="absolute -top-5 left-0 text-[11px] text-slate-400">Página {pn}</span>
          </div>
        ))}
      </div>
    </div>
  );
}