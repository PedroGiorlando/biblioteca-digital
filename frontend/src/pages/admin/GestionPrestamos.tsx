import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, Tag, TableContainer,
  Button, useToast,
  // 1. Imports nuevos
  Input, InputGroup, InputLeftElement, HStack
} from '@chakra-ui/react';
import { FaCheck } from 'react-icons/fa';
import { SearchIcon } from '@chakra-ui/icons';

interface PrestamoAdmin {
  id_prestamo: number;
  fecha_prestamo: string;
  estado: string;
  titulo_libro: string;
  nombre_usuario: string;
  email_usuario: string; // ¡La columna que pediste!
}

function GestionPrestamos() {
  // --- 2. ESTADOS NUEVOS ---
  const [prestamos, setPrestamos] = useState<PrestamoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { token } = useAuth();
  const toast = useToast();

  // --- 3. FETCH ACTUALIZADO ---
  const fetchPrestamos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', busqueda);
      params.append('page', currentPage.toString());

      const response = await api.get(`/prestamos/todos?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setPrestamos(response.data.prestamos);
      setTotalPages(response.data.totalPages);

    } catch (error) {
      console.error('Error al cargar prestamos:', error);
      toast({ title: 'Error al cargar préstamos', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 4. useEffect ACTUALIZADO
  useEffect(() => {
    if (token) {
      fetchPrestamos();
    }
  }, [token, currentPage, busqueda]);

  // --- 5. HANDLERS NUEVOS ---
  const handleMarcarDevuelto = async (idPrestamo: number) => {
    try {
      await api.put(`/prestamos/${idPrestamo}`, 
        { estado: 'Devuelto' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast({ title: 'Préstamo actualizado', status: 'success' });
      fetchPrestamos(); // Recarga la tabla
    } catch (error) {
      toast({ title: 'Error al actualizar', status: 'error' });
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
      <Heading mb={6}>Historial de Todos los Préstamos</Heading>

      {/* NUEVA BARRA DE BÚSQUEDA */}
      <Box mb={6}>
        <InputGroup w={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por libro, usuario o email..."
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </InputGroup>
      </Box>

      {/* Lógica de Carga / Vacío */}
      {loading ? (
        <Box textAlign="center" py={10}><Spinner size="xl" /></Box>
      ) : !loading && prestamos.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.500">
            {busqueda ? 'No se encontraron préstamos.' : 'No hay préstamos registrados.'}
          </Text>
        </Box>
      ) : (
        // Tabla de Préstamos
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Libro</Th>
                <Th>Usuario</Th>
                <Th>Email Usuario</Th> {/* ¡NUEVA COLUMNA! */}
                <Th>Fecha Préstamo</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {prestamos.map((p) => (
                <Tr key={p.id_prestamo}>
                  <Td>{p.titulo_libro}</Td>
                  <Td>{p.nombre_usuario}</Td>
                  <Td>{p.email_usuario}</Td> {/* ¡NUEVA CELDA! */}
                  <Td>{new Date(p.fecha_prestamo).toLocaleDateString()}</Td>
                  <Td>
                    <Tag colorScheme={p.estado === 'Activo' ? 'green' : p.estado === 'Devuelto' ? 'gray' : 'red'}>
                      {p.estado}
                    </Tag>
                  </Td>
                  <Td>
                    {p.estado === 'Activo' && (
                      <Button size="sm" colorScheme="green" onClick={() => handleMarcarDevuelto(p.id_prestamo)} leftIcon={<FaCheck />}>
                        Marcar Devuelto
                      </Button>
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

export default GestionPrestamos;