import {
  Box, Heading, Text, Button, Stack, Container, SimpleGrid, Icon, Flex,
  useColorModeValue, Image, VStack
} from '@chakra-ui/react';
import { FaBolt, FaLock, FaBookOpen, FaArrowRight } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import LibroCard from '../components/LibroCard'; 
import PromoBanner from '../components/PromoBanner';

// Interfaz rápida para los libros destacados
interface Libro {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  categoria: string | null;
}

export default function Home() {
  const [destacados, setDestacados] = useState<Libro[]>([]);
  
  // Colores
  const bgHero = useColorModeValue('gray.50', 'gray.900');
  const colorTextoSecundario = useColorModeValue('gray.600', 'gray.400');

  // Cargamos algunos libros para mostrar en la home (ej: los primeros 3)
  useEffect(() => {
    const fetchDestacados = async () => {
        try {
            // Pedimos libros (podrías crear un endpoint /libros/destacados en el futuro)
            // Por ahora traemos todos y cortamos los primeros 2 o 4
            const res = await api.get('/libros?limit=4'); 
            const data = res.data.libros ? res.data.libros : res.data;
            setDestacados(data.slice(0, 2)); // Mostramos solo 2 para no saturar
        } catch (error) {
            console.error(error);
        }
    };
    fetchDestacados();
  }, []);

  return (
    <Box>
       {/* Aquí se mostrará solo si corresponde */}
       <PromoBanner />
    <Box>
      {/* --- 1. HERO SECTION (La Portada) --- */}
      <Box bg={bgHero} position="relative" overflow="hidden">
        <Container maxW="container.xl" py={{ base: 16, md: 24 }}>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={10} align="center">
            
            {/* Texto Hero */}
            <Stack flex={1} spacing={6}>
              <Heading
                as="h1"
                size="3xl"
                lineHeight="1.2"
                fontWeight="bold"
              >
                Tu próxima gran historia <br />
                <Text as="span" color="blue.400">está a un click.</Text>
              </Heading>
              <Text color={colorTextoSecundario} fontSize="xl">
                Accede a una biblioteca infinita de conocimiento y entretenimiento. 
                Compra, descarga y lee al instante en cualquier dispositivo.
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                <Button
                  as={RouterLink}
                  to="/catalogo"
                  size="lg"
                  colorScheme="blue"
                  rightIcon={<FaArrowRight />}
                  px={8}
                >
                  Explorar Catálogo
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  size="lg"
                  variant="outline"
                  colorScheme="blue"
                >
                  Iniciar Sesión
                </Button>
              </Stack>
            </Stack>

            {/* Imagen Hero (Ilustrativa) */}
            <Flex flex={1} justify="center">
              <Image
                src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Libros y café"
                borderRadius="2xl"
                shadow="2xl"
                w="100%"
                maxW="500px"
                objectFit="cover"
              />
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* --- 2. BENEFICIOS (Features) --- */}
      <Container maxW="container.xl" py={20}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <Feature
            icon={FaBolt}
            title="Entrega Inmediata"
            text="Olvídate de los envíos. Compra tu libro y empieza a leerlo en segundos en formato digital."
          />
          <Feature
            icon={FaLock}
            title="Pago 100% Seguro"
            text="Utilizamos tecnología de encriptación de punta para proteger tus datos y transacciones."
          />
          <Feature
            icon={FaBookOpen}
            title="Catálogo Diverso"
            text="Desde clásicos de la literatura hasta las últimas novedades técnicas y de ficción."
          />
        </SimpleGrid>
      </Container>

      {/* --- 3. SECCIÓN DESTACADOS --- */}
      <Box bg={useColorModeValue('gray.50', 'gray.800')} py={20}>
        <Container maxW="container.xl">
            <Stack direction="row" justify="space-between" align="center" mb={10}>
                <Heading size="xl">Tendencias de la semana</Heading>
                <Button as={RouterLink} to="/catalogo" variant="link" colorScheme="blue">
                    Ver todo
                </Button>
            </Stack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
                {destacados.map(libro => (
                    <LibroCard key={libro.id} libro={libro} />
                ))}
            </SimpleGrid>
        </Container>
      </Box>
    </Box>
    </Box>
  );
}

// --- COMPONENTES AUXILIARES PARA LIMPIEZA ---

const Feature = ({ title, text, icon }: any) => {
  return (
    <Stack align="center" textAlign="center">
      <Flex
        w={16} h={16} align={'center'} justify={'center'}
        color={'white'} rounded={'full'} bg={'blue.500'} mb={1}
      >
        <Icon as={icon} w={8} h={8} />
      </Flex>
      <Text fontWeight={600} fontSize="lg">{title}</Text>
      <Text color={'gray.500'}>{text}</Text>
    </Stack>
  );
};

