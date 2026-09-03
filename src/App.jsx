import { Toaster } from "@/components/ui/toaster"
import { Toaster as HotToaster } from "react-hot-toast"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Orcamentos from '@/pages/Orcamentos';
import NovoOrcamento from '@/pages/NovoOrcamento';
import TabelaAco from '@/pages/TabelaAco';
import Clientes from '@/pages/Clientes';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Orcamentos />} />
      <Route path="/novo-orcamento" element={<NovoOrcamento />} />
      <Route path="/orcamento/:id" element={<NovoOrcamento />} />
      <Route path="/tabela-aco" element={<TabelaAco />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <HotToaster position="top-right" toastOptions={{ duration: 2500 }} />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App