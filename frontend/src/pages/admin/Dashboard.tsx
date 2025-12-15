import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Heading,
  Spinner,
  SimpleGrid,
  // 1. Importar los componentes de Estadísticas de Chakra
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon, HStack,
  Text
} from '@chakra-ui/react';
import { FaBook, FaUsers, FaExchangeAlt } from 'react-icons/fa'; // Íconos

// 2. Definimos el "molde" de los datos que esperamos
interface DashboardStats {
  totalUsuarios: number;
  totalLibros: number;
  totalPrestamosActivos: number;
  librosInactivos: number;
}

function Dashboard() {
  // 3. Estados para los datos y la carga
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth(); // Traemos el 'user' para el saludo

  // 4. useEffect para cargar los datos
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error al cargar stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <Box>
      <Heading mb={4}>¡Bienvenido, {user?.nombre}!</Heading>
      <Text fontSize="lg" color="gray.600" mb={8}>
        Aquí tienes un resumen del estado de la biblioteca:
      </Text>

      {/* 5. El Grupo de Estadísticas */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>

          {/* Tarjeta 1: Libros Activos */}
          <StatGroup>
            <Stat p={5} boxShadow="md" borderRadius="md" border="1px" borderColor="gray.200">
              <HStack>
                <Icon as={FaBook} boxSize={8} color="blue.500" />
                <Box>
                  <StatLabel>Libros en Catálogo</StatLabel>
                  <StatNumber>{stats.totalLibros}</StatNumber>
                  <StatHelpText>{stats.librosInactivos} libros inactivos</StatHelpText>
                </Box>
              </HStack>
            </Stat>
          </StatGroup>

          {/* Tarjeta 2: Préstamos Activos */}
          <StatGroup>
            <Stat p={5} boxShadow="md" borderRadius="md" border="1px" borderColor="gray.200">
              <HStack>
                <Icon as={FaExchangeAlt} boxSize={8} color="green.500" />
                <Box>
                  <StatLabel>Préstamos Activos</StatLabel>
                  <StatNumber>{stats.totalPrestamosActivos}</StatNumber>
                </Box>
              </HStack>
            </Stat>
          </StatGroup>

          {/* Tarjeta 3: Usuarios Totales */}
          <StatGroup>
            <Stat p={5} boxShadow="md" borderRadius="md" border="1px" borderColor="gray.200">
              <HStack>
                <Icon as={FaUsers} boxSize={8} color="purple.500" />
                <Box>
                  <StatLabel>Usuarios Registrados</StatLabel>
                  <StatNumber>{stats.totalUsuarios}</StatNumber>
                </Box>
              </HStack>
            </Stat>
          </StatGroup>

        </SimpleGrid>
      )}
    </Box>
  );
}

export default Dashboard;