import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Box, Heading, SimpleGrid, Image, Text, Button, Spinner, 
  Container, Badge, VStack, Icon, useColorModeValue, Center, HStack 
} from '@chakra-ui/react';
import { FaBookOpen, FaCalendarCheck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface LibroAdquirido {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string;
  fecha_adquisicion: string;
}

function MiBiblioteca() {
  const [libros, setlibros] = useState<LibroAdquirido[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Diseño
  const bgCard = useColorModeValue('white', 'gray.700');
  const borderCard = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const cargarBiblioteca = async () => {
      try {
        const response = await api.get('/adquisiciones/mis-libros', {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        setlibros(response.data);
      } catch (error) {
        console.error("Error cargando biblioteca", error);
      } finally {
        setLoading(false);
      }
    };

    cargarBiblioteca();
  }, [token]);

  if (loading) return <Center mt={20}><Spinner size="xl" color="blue.500" /></Center>;

  return (
    <Container maxW="container.xl" mt={10}>
      <VStack spacing={2} align="start" mb={8}>
        <Heading>Mi Biblioteca Personal</Heading>
        <Text color="gray.500">
          Tienes {libros.length} {libros.length === 1 ? 'libro' : 'libros'} en tu colección.
        </Text>
      </VStack>

      {libros.length === 0 ? (
        <Box textAlign="center" py={20} bg={bgCard} borderRadius="lg" borderWidth="1px" borderColor={borderCard}>
          <Icon as={FaBookOpen} boxSize="50px" color="gray.300" mb={4} />
          <Heading size="md" mb={2}>Tu biblioteca está vacía</Heading>
          <Text mb={6} color="gray.500">Aún no has adquirido ningún libro.</Text>
          <Button as={Link} to="/catalogo" colorScheme="blue">
            Explorar Catálogo
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
          {libros.map((libro: any) => { // Ponemos :any temporalmente para evitar quejas de TS
            
            // INTENTAMOS OBTENER LA FECHA (soporta ambos nombres por seguridad)
            const fechaRaw = libro.fecha_compra || libro.fecha_adquisicion;
            const fechaValida = fechaRaw && !isNaN(new Date(fechaRaw).getTime());

            return (
                <Box 
                  key={libro.id} 
                  bg={bgCard} 
                  borderWidth="1px" 
                  borderColor={borderCard}
                  borderRadius="lg" 
                  overflow="hidden" 
                  boxShadow="sm"
                  transition="transform 0.2s"
                  _hover={{ transform: 'translateY(-5px)', shadow: 'md' }}
                >
                  <Image 
                    src={libro.portada_url?.startsWith('http') ? libro.portada_url : `https://biblioteca-digital-fi5y.onrender.com/${libro.portada_url}`}
                    alt={libro.titulo}
                    h="250px" 
                    w="100%" 
                    objectFit="cover"
                  />

                  <Box p={5}>
                    <Badge colorScheme="green" mb={2}>PROPIEDAD</Badge>
                    
                    <Heading size="md" noOfLines={1} mb={1}>{libro.titulo}</Heading>
                    <Text fontSize="sm" color="gray.500" mb={4}>{libro.autor}</Text>

                    <HStack fontSize="xs" color="gray.400" mb={4} spacing={1}>
                      <Icon as={FaCalendarCheck} />
                      <Text>
                        {fechaValida 
                            ? `Comprado el ${new Date(fechaRaw).toLocaleDateString()}` 
                            : 'Fecha desconocida'}
                      </Text>
                    </HStack>

                    <Button 
                      as={Link} 
                      to={`/leer/${libro.id}`} 
                      width="100%" 
                      colorScheme="blue" 
                      variant="outline"
                      leftIcon={<Icon as={FaBookOpen} />}
                    >
                      Leer Ahora
                    </Button>
                  </Box>
                </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
);
}
export default MiBiblioteca;