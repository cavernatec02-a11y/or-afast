import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { FileText, Users, Layers, Plus } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const LOGO_URL = "https://media.base44.com/images/public/6a95cd709d1eb3285a3e45a0/ae1c1268b_WhatsAppImage2026-07-20at152818.jpeg";

export default function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: "Orçamentos", icon: <FileText size={16} /> },
    { to: "/clientes", label: "Clientes", icon: <Users size={16} /> },
    { to: "/tabela-aco", label: "Tabela de Aço", icon: <Layers size={16} /> },
  ];
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 dark:bg-slate-900 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10">
            <Image src={LOGO_URL} alt="Ripresa" fittingType="fit" className="h-10 w-10" />
          </div>
          <div className="leading-none">
            <span className="block text-base font-bold text-slate-900 dark:text-slate-100">OrçaRipresa</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Soluções de Armazenagem</span>
          </div>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${pathname === l.to ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"}`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link to="/novo-orcamento" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
            <Plus size={16} /> <span className="hidden sm:inline">Novo orçamento</span><span className="sm:hidden">Novo</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}