// frontend/src/context/AuthContext.tsx
import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

// 1. Definimos los "tipos" de datos que guardaremos
interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Usuario Registrado';
  foto_url?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  actualizarUsuario: (datosNuevos: any) => void;
}

// 2. Creamos el Contexto con un valor inicial (null)
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Creamos el "Proveedor" del contexto
// Este componente envolverá nuestra aplicación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 4. Efecto que se ejecuta UNA VEZ al cargar la app
  // Revisa el localStorage para ver si ya estábamos logueados
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('usuario');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);
 const actualizarUsuario = (datosNuevos: any) => {
    // 1. Actualizamos el estado de React (para que se vea al instante)
    setUser((prevUser: any) => {
      if (!prevUser) return null;

      const usuarioActualizado = { ...prevUser, ...datosNuevos };

      // 2. ¡LA CLAVE! Guardamos en localStorage para que sobreviva al F5
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

      return usuarioActualizado;
    });
  };
  // 5. Función de Login: guarda en el estado Y en localStorage
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('usuario', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  // 6. Función de Logout: limpia el estado Y el localStorage
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

return (
    <AuthContext.Provider value={{ 
        isAuthenticated: !!user, 
        token, 
        user, 
        login, 
        logout,
        actualizarUsuario // <--- NO OLVIDES AGREGARLA AQUÍ
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 7. Creamos un "Hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}