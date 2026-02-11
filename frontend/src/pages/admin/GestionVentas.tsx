import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Text, Spinner, Flex, useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Venta {
  id: number;
  fecha_compra: string;
  monto_pagado: number;
  usuario: string;
  email: string;
  libro: string;
}

export default function GestionVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // --- COLORES MODO OSCURO ---
  const bgTable = useColorModeValue('white', 'gray.800');
  const colorTexto = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgHeader = useColorModeValue('gray.50', 'gray.900');
  const bgHover = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const res = await api.get('/adquisiciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setVentas(res.data);
      } catch (error) {
        console.error("Error cargando ventas", error);
      } finally {
        setLoading(false);
      }
    };
    cargarVentas();
  }, [token]);

  if (loading) return <Flex justify="center" mt={10}><Spinner size="xl" /></Flex>;

return (
    <Box maxW="container.xl" mx="auto">
      <Heading mb={6}>Historial de Ventas</Heading>
      
     
      <Box bg={bgTable} color={colorTexto} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg={bgHeader}> 
              <Tr>
                <Th color={colorTexto} borderColor={borderColor}>ID</Th>
                <Th color={colorTexto} borderColor={borderColor}>Fecha</Th>
                <Th color={colorTexto} borderColor={borderColor}>Usuario</Th>
                <Th color={colorTexto} borderColor={borderColor}>Libro Vendido</Th>
                <Th color={colorTexto} borderColor={borderColor} isNumeric>Monto</Th>
              </Tr>
            </Thead>
            <Tbody>
              {ventas.map((venta) => (
                <Tr key={venta.id} _hover={{ bg: bgHover }}>
                  <Td borderColor={borderColor}>
                    <Badge colorScheme="purple">#{venta.id}</Badge>
                  </Td>
                  <Td borderColor={borderColor}>
                      {new Date(venta.fecha_compra).toLocaleDateString()} 
                      {' '}
                      <Text as="span" fontSize="xs" color="gray.500">
                          {new Date(venta.fecha_compra).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                  </Td>
                  <Td borderColor={borderColor}>
                      <Text fontWeight="bold" fontSize="sm">{venta.usuario}</Text>
                      <Text fontSize="xs" color="gray.500">{venta.email}</Text>
                  </Td>
                  <Td borderColor={borderColor} fontWeight="medium">{venta.libro}</Td>
                  <Td borderColor={borderColor} isNumeric>
                      <Badge colorScheme="green" fontSize="0.9em" variant="subtle">
                          ${venta.monto_pagado}
                      </Badge>
                  </Td>
                </Tr>
              ))}
              {ventas.length === 0 && (
                  <Tr>
                      <Td colSpan={5} textAlign="center" py={10}>No hay ventas registradas aún.</Td>
                  </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}