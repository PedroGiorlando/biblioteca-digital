import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Este componente recibirá "hijos" (children)
interface Props {
  children: ReactNode;
}

function RutaProtegida({ children }: Props) {
  // 1. Se conecta al "cerebro" para ver si el usuario está logueado
  const { isAuthenticated } = useAuth();

  // 2. Si NO está logueado...
  if (!isAuthenticated) {
    // 3. Lo redirige a la página de login.
    // "replace" evita que el usuario pueda "volver atrás" a la pág. protegida
    return <Navigate to="/login" replace />;
  }

  // 4. Si SÍ está logueado, simplemente muestra la página
  // que estaba intentando ver (los "children").
  return children;
}

export default RutaProtegida;