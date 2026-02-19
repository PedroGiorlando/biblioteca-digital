import {
  Box, Heading, SimpleGrid, Text, VStack, HStack, Progress,
  Card, CardHeader, CardBody, Avatar, Badge, Flex, Spinner
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Reportes() {
  const [topLibros, setTopLibros] = useState<any[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const [resLibros, resUsuarios] = await Promise.all([
            api.get('/admin/reportes/top-libros', { headers: { Authorization: `Bearer ${token}` } }),
            api.get('/admin/reportes/top-usuarios', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setTopLibros(resLibros.data);
        setTopUsuarios(resUsuarios.data);
      } catch (error) {
        console.error("Error cargando reportes", error);
      } finally {
        setLoading(false);
      }
    };
    cargarReportes();
  }, [token]);

  if (loading) return <Flex justify="center" mt={10}><Spinner size="xl" /></Flex>;

  const maxVentas = Math.max(...topLibros.map((l: any) => l.total_ventas), 1);

  return (
    <Box maxW="container.xl" mx="auto">
      <Heading mb={6}>Reportes y Métricas</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
        
        {/* --- REPORTE 1: LIBROS MÁS VENDIDOS --- */}
        <Card shadow="md" borderWidth="1px">
          <CardHeader>
            <Heading size="md">📚 Best Sellers (Top 5)</Heading>
            <Text fontSize="sm" color="gray.500">Libros con mayor volumen de ventas</Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {topLibros.map((libro, index) => (
                <Box key={index}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontWeight="bold" noOfLines={1}>{libro.titulo}</Text>
                    <Badge colorScheme="green">{libro.total_ventas} ventas</Badge>
                  </Flex>
                  {/* Barra de Progreso Simulando Gráfico */}
                  <Progress 
                    value={(libro.total_ventas / maxVentas) * 100} 
                    colorScheme="teal" 
                    size="sm" 
                    borderRadius="full" 
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Generó: ${libro.ingresos_generados}
                  </Text>
                </Box>
              ))}
              {topLibros.length === 0 && <Text>No hay datos de ventas aún.</Text>}
            </VStack>
          </CardBody>
        </Card>

        {/* --- REPORTE 2: MEJORES CLIENTES --- */}
        <Card shadow="md" borderWidth="1px">
          <CardHeader>
            <Heading size="md">💎 Clientes VIP (Top 5)</Heading>
            <Text fontSize="sm" color="gray.500">Usuarios que más han invertido</Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {topUsuarios.map((usuario, index) => (
                <HStack key={index} p={3} borderWidth="1px" borderRadius="md" justify="space-between">
                  <HStack>
                    <Avatar name={usuario.nombre} size="sm" bg="purple.500" color="white" />
                    <Box>
                        <Text fontWeight="bold" fontSize="sm">{usuario.nombre}</Text>
                        <Text fontSize="xs" color="gray.500">{usuario.email}</Text>
                    </Box>
                  </HStack>
                  
                  <Box textAlign="right">
                    <Text fontWeight="bold" color="green.600">${usuario.total_gastado}</Text>
                    <Badge fontSize="0.6em" colorScheme="purple">
                        {usuario.libros_comprados} libros
                    </Badge>
                  </Box>
                </HStack>
              ))}
              {topUsuarios.length === 0 && <Text>No hay clientes VIP aún.</Text>}
            </VStack>
          </CardBody>
        </Card>

      </SimpleGrid>
    </Box>
  );
}