import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Text,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

// Componente auxiliar para los links (más compacto)
const LinkFooter = ({ children, to }: { children: React.ReactNode; to: string }) => (
  <Text
    as={RouterLink}
    to={to}
    _hover={{ textDecoration: 'underline', color: 'white' }} // Al pasar el mouse se pone blanco puro
    color="gray.300" // Color gris claro por defecto
    fontSize="sm"
    display="block"
  >
    {children}
  </Text>
);

export default function Footer() {
 const bgFooter = useColorModeValue('teal.900', 'gray.900'); 

  return (
    <Box bg={bgFooter} color="gray.200">
      <Container as={Stack} maxW={'container.xl'} py={6}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          
          {/* COLUMNA 1: MARCA */}
          <Stack align={'flex-start'}>
            <Heading size="md" mb={1} color="white">Biblioteca Digital</Heading>
            <Text fontSize="xs" color="gray.400">
              © {new Date().getFullYear()} Todos los derechos reservados.
            </Text>
          </Stack>

          {/* COLUMNA 2: PRODUCTO */}
          <Stack align={'flex-start'} spacing={1}> {/* spacing={1} junta más los elementos */}
            <Text fontWeight={'bold'} fontSize="md" mb={1} color="white">Producto</Text>
            <LinkFooter to="/catalogo">Catálogo</LinkFooter>
            <LinkFooter to="#">Novedades</LinkFooter>
            <LinkFooter to="#">Más vendidos</LinkFooter>
          </Stack>

          {/* COLUMNA 3: SOPORTE */}
          <Stack align={'flex-start'} spacing={1}>
            <Text fontWeight={'bold'} fontSize="md" mb={1} color="white">Soporte</Text>
            <LinkFooter to="#">Ayuda</LinkFooter>
            <LinkFooter to="#">Términos</LinkFooter>
            <LinkFooter to="#">Privacidad</LinkFooter>
          </Stack>

          {/* COLUMNA 4: SÍGUENOS */}
          <Stack align={'flex-start'} spacing={1}>
            <Text fontWeight={'bold'} fontSize="md" mb={1} color="white">Síguenos</Text>
            <LinkFooter to="#">Instagram</LinkFooter>
            <LinkFooter to="#">Twitter</LinkFooter>
            <LinkFooter to="#">LinkedIn</LinkFooter>
          </Stack>

        </SimpleGrid>
      </Container>
    </Box>
  );
}