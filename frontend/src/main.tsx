import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import {AuthProvider} from './context/AuthContext.tsx' 
import theme from './Theme.ts';
import App from './App.tsx'

// Rutas Públicas
import Login from './pages/Login.tsx'
import Registro from './pages/Registro.tsx'
import RecuperarPassword from './pages/RecuperarPassword.tsx';
import Home from './pages/Home.tsx'; 
import Catalogo from './pages/Catalogo.tsx';
import LibroDetalle from './pages/LibroDetalle.tsx';
import MiBiblioteca from './pages/MiBiblioteca.tsx';
import Lector from './pages/Lector';
import MiPerfil from './pages/MiPerfil.tsx';
import ListaDeseados from './pages/ListaDeseados.tsx';

// Rutas Admin
import RutaAdmin from './components/RutaAdmin.tsx';
import AdminLayout from './pages/admin/AdminLayout.tsx';
import Dashboard from './pages/admin/Dashboard.tsx';
import GestionUsuarios from './pages/admin/GestionUsuarios.tsx';
import GestionVentas from './pages/admin/GestionVentas.tsx';
import Reportes from './pages/admin/Reportes.tsx';
import GestionLibros from './pages/admin/GestionLibros.tsx';

// Seguridad
import RutaProtegida from './components/RutaProtegida.tsx';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App contiene el Navbar y el Outlet
    children: [
      
      // 1. LA NUEVA PORTADA (LANDING PAGE)
      {
        index: true, 
        element: <Home />, 
      },

      // 2. EL CATÁLOGO AHORA TIENE SU PROPIA RUTA
      {
        path: '/catalogo',
        element: <Catalogo />,
      },

      // 3. DETALLE DEL LIBRO
      {
        path: '/libro/:id',
        element: <LibroDetalle />,
      },

      // --- RUTAS DE ACCESO ---
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Registro /> },
      { path: '/recuperar', element: <RecuperarPassword /> },

      // --- RUTAS PROTEGIDAS (USUARIOS LOGUEADOS) ---
      {
        path: '/mi-biblioteca',
        element: <RutaProtegida><MiBiblioteca /></RutaProtegida>,
      },
      {
        path: '/leer/:id',
        element: <RutaProtegida><Lector /></RutaProtegida>,
      },
      {
        path: '/perfil', 
        element: <RutaProtegida><MiPerfil /></RutaProtegida>,
      },
      { 
        path: '/deseados', 
        element: <RutaProtegida><ListaDeseados /></RutaProtegida> 
      },

      // --- SECCIÓN DE RUTAS DE ADMIN ---
      {
        path: '/admin',
        element: (
          <RutaProtegida>
            <RutaAdmin>
              <AdminLayout />
            </RutaAdmin>
          </RutaProtegida>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'usuarios', element: <GestionUsuarios /> },
          { path: 'ventas', element: <GestionVentas /> },
          { path: 'reportes', element: <Reportes /> },
          { path: 'libros', element: <GestionLibros /> },
        ],
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