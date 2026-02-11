import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
}

function RutaAdmin({ children }: Props) {
  // 1. Nos conectamos al "cerebro" (AuthContext)
  const { isAuthenticated, user } = useAuth();

  // 2. Revisamos si está logueado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. ¡LA LÓGICA CLAVE!
  // Revisamos si el usuario (que SÍ está logueado) tiene el rol
  if (user?.rol !== 'Administrador') {
    // 4. Si no es Admin, lo "echamos" a la página de inicio.
    // No le mostramos un error, simplemente no lo dejamos entrar.
    return <Navigate to="/" replace />;
  }

  // 5. Si es un Admin logueado, le mostramos la página
  return children;
}

export default RutaAdmin;