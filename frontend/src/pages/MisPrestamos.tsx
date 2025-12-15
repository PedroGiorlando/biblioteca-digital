import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, Tag, TableContainer,
  Button, useToast, Tooltip
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons'; // O impórtalo de react-icons si prefieres

interface Prestamo {
  id_prestamo: number;
  fecha_prestamo: string;
  fecha_devolucion: string | null;
  estado: 'Activo' | 'Devuelto' | 'Vencido';
  titulo: string;
  autor: string;
}

function MisPrestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const toast = useToast();

  // Movi la función afuera del useEffect para poder reusarla al devolver
  const fetchMisPrestamos = async () => {
    try {
      const response = await api.get('/prestamos/mis-prestamos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPrestamos(response.data);
    } catch (error) {
      console.error('Error al cargar mis préstamos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMisPrestamos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- NUEVA FUNCIÓN DE DEVOLUCIÓN ---
  const handleDevolverLibro = async (idPrestamo: number) => {
    try {
      await api.put(`/prestamos/devolver/${idPrestamo}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast({
        title: 'Libro devuelto',
        description: 'Esperamos que lo hayas disfrutado.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Recargamos la lista para que cambie el estado visualmente
      fetchMisPrestamos();

    } catch (error: any) {
      toast({
        title: 'Error al devolver',
        description: error.response?.data?.error || 'Ocurrió un error',
        status: 'error',
      });
    }
  };

  if (loading) return <Box textAlign="center" mt={20}><Spinner size="xl" /></Box>;

  return (
    <Box>
      <Heading mb={6}>Mi Historial de Préstamos</Heading>
      {prestamos.length === 0 ? (
        <Text fontSize="lg" color="gray.500">Aún no has solicitado ningún préstamo.</Text>
      ) : (
        <TableContainer>
          <Table variant="striped" colorScheme="gray">
            <Thead>
              <Tr>
                <Th>Libro</Th>
                <Th>Autor</Th>
                <Th>Fecha de Préstamo</Th>
                <Th>Estado</Th>
                <Th>Acción</Th> {/* Nueva columna */}
              </Tr>
            </Thead>
            <Tbody>
              {prestamos.map((prestamo) => (
                <Tr key={prestamo.id_prestamo}>
                  <Td fontWeight="medium">{prestamo.titulo}</Td>
                  <Td>{prestamo.autor}</Td>
                  <Td>{new Date(prestamo.fecha_prestamo).toLocaleDateString()}</Td>
                  <Td>
                    <Tag colorScheme={
                      prestamo.estado === 'Activo' ? 'green' :
                      prestamo.estado === 'Devuelto' ? 'gray' : 'red'
                    }>
                      {prestamo.estado}
                    </Tag>
                  </Td>
                  <Td>
                    {/* Solo mostramos el botón si está Activo */}
                    {prestamo.estado === 'Activo' && (
                      <Tooltip label="Terminar lectura y devolver">
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          variant="outline"
                          leftIcon={<CheckIcon />}
                          onClick={() => handleDevolverLibro(prestamo.id_prestamo)}
                        >
                          Devolver
                        </Button>
                      </Tooltip>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default MisPrestamos;