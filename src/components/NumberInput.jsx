import React, { useState, useEffect } from "react";

// Input numérico robusto: mantém o texto local para permitir digitar decimais e limpar o campo
// sem que o React "pule" para 0. Só converte para número ao notificar o parent.
export default function NumberInput({ value, onChange, className, placeholder, prefix, suffix, allowNegative }) {
  const [str, setStr] = useState("");

  useEffect(() => {
    const v = Number(value ?? 0);
    const currentNum = str === "" || str === "-" || str === "." ? 0 : Number(str);
    if (Number.isNaN(currentNum)) return;
    if (currentNum !== v) {
      setStr(v === 0 ? "" : String(v));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    let s = e.target.value.replace(/[^\d.,-]/g, "").replace(/,/g, ".");
    if (!allowNegative) s = s.replace(/-/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    setStr(s);
    const n = s === "" || s === "-" || s === "." ? 0 : Number(s);
    onChange(Number.isNaN(n) ? 0 : n);
  };

  return (
    <div className="flex items-center gap-1 w-full">
      {prefix && <span className="text-sm text-slate-400 shrink-0">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={str}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      {suffix && <span className="text-sm text-slate-400 shrink-0">{suffix}</span>}
    </div>
  );
}