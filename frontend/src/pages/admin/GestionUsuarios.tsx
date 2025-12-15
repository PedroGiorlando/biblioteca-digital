import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Heading, Spinner, Table, Thead, Tbody, Tr, Th, Td, Tag, TableContainer,
  Select, useToast,
  // 1. Imports nuevos
  Input, InputGroup, InputLeftElement, HStack, Button, Text
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons'; // Importar ícono

// ... (la 'interface Usuario' es la misma) ...
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Usuario Registrado';
}

function GestionUsuarios() {
  // --- 2. ESTADOS NUEVOS ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { token, user: adminUser } = useAuth();
  const toast = useToast();

  // --- 3. FETCH ACTUALIZADO ---
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', busqueda);
      params.append('page', currentPage.toString());

      const response = await api.get(`/usuarios?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUsuarios(response.data.usuarios); // Guardamos el array de usuarios
      setTotalPages(response.data.totalPages); // Guardamos el total de páginas

    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({ title: 'Error al cargar usuarios', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 4. useEffect ACTUALIZADO
  useEffect(() => {
    if (token) {
      fetchUsuarios();
    }
  }, [token, currentPage, busqueda]); // Se recarga si cambia la pág o la búsqueda

  // --- 5. HANDLERS NUEVOS ---
  const handleRolChange = async (e: React.ChangeEvent<HTMLSelectElement>, usuarioId: number) => {
    const nuevoRol = e.target.value;
    try {
      await api.put(`/usuarios/${usuarioId}`,
        { rol: nuevoRol },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast({ title: 'Rol actualizado', status: 'success' });
      // No es necesario llamar a fetchUsuarios() aquí,
      // porque el <Select> ya refleja el estado visualmente.
      // Pero si quisiéramos recargar toda la data, lo haríamos.

      // Actualicemos solo el estado local para que se vea bien
      setUsuarios(usuarios.map(u => u.id === usuarioId ? {...u, rol: nuevoRol as any} : u));

    } catch (error: any) {
      toast({ title: 'Error al cambiar rol', description: error.response?.data?.error, status: 'error' });
      fetchUsuarios(); // Recarga para revertir el <Select> si falla
    }
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1); // Resetea a la página 1
  };

  const handlePaginaSiguiente = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePaginaAnterior = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  // --- 6. JSX ACTUALIZADO ---
  return (
    <Box>
      <Heading mb={6}>Gestión de Usuarios</Heading>

      {/* NUEVA BARRA DE BÚSQUEDA */}
      <Box mb={6}>
        <InputGroup w={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </InputGroup>
      </Box>

      {/* Lógica de Carga / Vacío */}
      {loading ? (
        <Box textAlign="center" py={10}><Spinner size="xl" /></Box>
      ) : !loading && usuarios.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.500">
            {busqueda ? 'No se encontraron usuarios.' : 'No hay usuarios registrados.'}
          </Text>
        </Box>
      ) : (
        // Tabla de Usuarios
        <TableContainer>
          <Table variant="striped">
            {/* ... (Thead es igual) ... */}
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
              </Tr>
            </Thead>
            <Tbody>
              {usuarios.map((usuario) => (
                <Tr key={usuario.id}>
                  <Td>{usuario.id}</Td>
                  <Td>{usuario.nombre}</Td>
                  <Td>{usuario.email}</Td>
                  <Td>
                    {adminUser?.id === usuario.id ? (
                      <Tag colorScheme="cyan">{usuario.rol} (Tú)</Tag>
                    ) : (
                      <Select
                        value={usuario.rol}
                        onChange={(e) => handleRolChange(e, usuario.id)}
                        size="sm"
                        w="200px"
                      >
                        <option value="Usuario Registrado">Usuario Registrado</option>
                        <option value="Administrador">Administrador</option>
                      </Select>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* NUEVA PAGINACIÓN */}
      {totalPages > 1 && (
        <HStack justifyContent="center" mt={10} spacing={4}>
          <Button onClick={handlePaginaAnterior} isDisabled={currentPage === 1}>
            Anterior
          </Button>
          <Text>
            Página {currentPage} de {totalPages}
          </Text>
          <Button onClick={handlePaginaSiguiente} isDisabled={currentPage === totalPages}>
            Siguiente
          </Button>
        </HStack>
      )}
    </Box>
  );
}

export default GestionUsuarios;