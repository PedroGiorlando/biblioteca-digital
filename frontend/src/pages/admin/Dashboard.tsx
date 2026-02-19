import {
  Box, SimpleGrid, Stat, StatLabel, StatNumber, Flex, useColorModeValue, Heading, Spinner
} from '@chakra-ui/react';
import { FiUsers, FiBook, FiDollarSign, FiShoppingCart } from 'react-icons/fi'; 
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface StatsData {
  totalUsuarios: number;
  totalLibros: number;
  totalVentas: number;
  gananciasTotales: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Colores para las tarjetas
  const bgCard = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <Flex justify="center" p={10}><Spinner size="xl" /></Flex>;

  return (
    <Box>
      <Heading mb={6}>Resumen del Negocio</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
        
        {/* TARJETA 1: GANANCIAS */}
        <StatCard
          title={'Ingresos Totales'}
          stat={`$${stats?.gananciasTotales || 0}`}
          icon={<FiDollarSign size={'3em'} />}
          bg={bgCard}
          color="green.400"
        />

        {/* TARJETA 2: VENTAS */}
        <StatCard
          title={'Libros Vendidos'}
          stat={stats?.totalVentas || 0}
          icon={<FiShoppingCart size={'3em'} />}
          bg={bgCard}
          color="blue.400"
        />

        {/* TARJETA 3: USUARIOS */}
        <StatCard
          title={'Usuarios Registrados'}
          stat={stats?.totalUsuarios || 0}
          icon={<FiUsers size={'3em'} />}
          bg={bgCard}
          color="purple.400"
        />

        {/* TARJETA 4: CATALOGO */}
        <StatCard
          title={'Libros Activos'}
          stat={stats?.totalLibros || 0}
          icon={<FiBook size={'3em'} />}
          bg={bgCard}
          color="orange.400"
        />
        
      </SimpleGrid>
    </Box>
  );
}

// Componente auxiliar para las tarjetas
function StatCard(props: any) {
  const { title, stat, icon, bg, color } = props;
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      rounded={'lg'}
      bg={bg}>
      <Flex justifyContent={'space-between'}>
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'bold'}>
            {stat}
          </StatNumber>
        </Box>
        <Box
          my={'auto'}
          color={color}
          alignContent={'center'}>
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}