import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import RutaAdmin from './components/RutaAdmin.tsx';
import AdminLayout from './pages/admin/AdminLayout.tsx';
import GestionUsuarios from './pages/admin/GestionUsuarios.tsx';
import GestionPrestamos from './pages/admin/GestionPrestamos.tsx';
import Reportes from './pages/admin/Reportes.tsx';
import GestionLibros from './pages/admin/GestionLibros.tsx';
import theme from './Theme.ts';
import Dashboard from './pages/admin/Dashboard.tsx';

import RutaProtegida from './components/RutaProtegida.tsx';

// 1. IMPORTAR EL AUTH PROVIDER
import { AuthProvider } from './context/AuthContext.tsx'

import App from './App.tsx'
import Login from './pages/Login.tsx'
import Registro from './pages/Registro.tsx'
import MisPrestamos from './pages/MisPrestamos.tsx';
import Catalogo from './pages/Catalogo.tsx';
import LibroDetalle from './pages/LibroDetalle.tsx';
import RecuperarPassword from './pages/RecuperarPassword.tsx';
import MiPerfil from './pages/MiPerfil.tsx';
import ListaDeseados from './pages/ListaDeseados.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App (Layout) es el padre
    children: [
      // Rutas públicas
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Registro /> },
      { path: '/recuperar', element: <RecuperarPassword /> },

      // ¡NUEVA RUTA PROTEGIDA!
      {
        path: '/mis-prestamos',
        element: (
          <RutaProtegida>
            <MisPrestamos />
          </RutaProtegida>
        ),
      },
      {
        path: '/perfil', // <--- ¡AQUÍ ES EL LUGAR CORRECTO! (Fuera de admin)
        element: (
          <RutaProtegida>
            <MiPerfil />
          </RutaProtegida>
        ),
        
      },
      { path: '/deseados', element: <RutaProtegida><ListaDeseados /></RutaProtegida> },
      // --- ¡NUEVO! SECCIÓN DE RUTAS DE ADMIN ---
      {
        path: '/admin',
        element: (
          <RutaProtegida> {/* 1er Guardia: ¿Logueado? */}
            <RutaAdmin>    {/* 2do Guardia: ¿Admin? */}
              <AdminLayout /> {/* Si pasa, muestra el Layout de Admin */}
            </RutaAdmin>
          </RutaProtegida>
        ),
        // Rutas hijas que se renderizan DENTRO del <AdminLayout>
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'usuarios', element: <GestionUsuarios /> },
          { path: 'prestamos', element: <GestionPrestamos /> },
          { path: 'reportes', element: <Reportes /> },
          { path: 'libros', element: <GestionLibros /> },
          
        ],
      },
      {
        path: '/', // La página de inicio será el catálogo
        element: <Catalogo />,
      },
      {
        path: '/catalogo', // Ruta alternativa para el catálogo
        element: <Catalogo />,
      },
      {
        path: '/libro/:id', // Ruta para ver un libro específico
        element: <LibroDetalle />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <AuthProvider>
      <ChakraProvider theme={theme}> 
        <RouterProvider router={router} />
      </ChakraProvider>
    </AuthProvider>
  </React.StrictMode>,
)