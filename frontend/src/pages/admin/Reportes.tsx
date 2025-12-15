import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  // 1. Importar botones
  Button, ButtonGroup, HStack
} from '@chakra-ui/react';

interface ReportePopular {
  titulo: string;
  autor: string;
  numero_de_prestamos: number;
}

// 2. Definir los tipos de filtro
type TipoReporte = 'actual' | 'historico';

function Reportes() {
  const [populares, setPopulares] = useState<ReportePopular[]>([]);
  const [loading, setLoading] = useState(true);
  // 3. Nuevo estado para guardar el filtro seleccionado
  const [tipo, setTipo] = useState<TipoReporte>('actual');
  const { token } = useAuth();

  // 4. useEffect ahora depende de 'token' Y 'tipo'
  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true); // Mostrar spinner cada vez que cambiamos
      try {
        // 5. Pasamos el 'tipo' de filtro a la API
        const response = await api.get(`/reportes/populares?tipo=${tipo}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPopulares(response.data);
      } catch (error) {
        console.error('Error al cargar reporte:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReporte();
    }
  }, [token, tipo]); // Se re-ejecuta si el 'tipo' cambia

  return (
    <Box>
      {/* 6. Título y Botones */}
      <HStack justifyContent="space-between" mb={6}>
        <Heading>
          Reporte: Libros Más Populares
          <Text as="span" color="gray.500" fontSize="2xl" ml={3}>
            ({tipo === 'actual' ? 'Catálogo Actual' : 'Histórico'})
          </Text>
        </Heading>
        <ButtonGroup isAttached>
          <Button
            colorScheme={tipo === 'actual' ? 'blue' : 'gray'}
            onClick={() => setTipo('actual')}
          >
            Actual
          </Button>
          <Button
            colorScheme={tipo === 'historico' ? 'blue' : 'gray'}
            onClick={() => setTipo('historico')}
          >
            Histórico
          </Button>
        </ButtonGroup>
      </HStack>

      {/* 7. Vista de Carga */}
      {loading ? (
        <Box textAlign="center" mt={20}>
          <Spinner size="xl" />
        </Box>
      ) : (
        // 8. La tabla (es la misma de antes)
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Título</Th>
                <Th>Autor</Th>
                <Th isNumeric>N° de Préstamos</Th>
              </Tr>
            </Thead>
            <Tbody>
              {populares.map((libro) => (
                <Tr key={libro.titulo}>
                  <Td>{libro.titulo}</Td>
                  <Td>{libro.autor}</Td>
                  <Td isNumeric>{libro.numero_de_prestamos}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Reportes;