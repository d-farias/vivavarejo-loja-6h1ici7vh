import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Index from './pages/Index'
import Rotinas from './pages/Rotinas'
import Agenda from './pages/Agenda'
import Equipe from './pages/Equipe'
import Admin from './pages/Admin'
import Promotores from './pages/Promotores'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BemVindo from './pages/BemVindo'
import NotFound from './pages/NotFound'
import Validades from './pages/Validades'
import Perdas from './pages/Perdas'

const DocumentTitleSync = () => {
  const location = useLocation()

  useEffect(() => {
    // Garante que a aba do navegador exiba estritamente "VivaVarejo" sem "Skip" em todas as rotas
    if (document.title !== 'VivaVarejo') {
      document.title = 'VivaVarejo'
    }
  }, [location.pathname])

  return null
}

const App = () => (
  <BrowserRouter>
    <DocumentTitleSync />
    <AuthProvider>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <Agenda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rotinas"
                element={
                  <ProtectedRoute>
                    <Rotinas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/validades"
                element={
                  <ProtectedRoute>
                    <Validades />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perdas"
                element={
                  <ProtectedRoute>
                    <Perdas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipe"
                element={
                  <ProtectedRoute>
                    <Equipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promotores"
                element={
                  <ProtectedRoute>
                    <Promotores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cadastro" element={<Signup />} />
            </Route>

            {/* Public External Landing Page */}
            <Route path="/bem-vindo" element={<BemVindo />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </StoreProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
