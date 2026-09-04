import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Index from './pages/Index'
import Rotinas from './pages/Rotinas'
import Equipe from './pages/Equipe'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
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
              path="/rotinas"
              element={
                <ProtectedRoute>
                  <Rotinas />
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

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
