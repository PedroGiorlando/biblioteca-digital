import { Box, Flex, Text, Button, Icon, CloseButton, Container, ScaleFade } from '@chakra-ui/react';
import { FaGift, FaPercentage } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import api from '../services/api'; 

export default function PromoBanner() {
  const { isAuthenticated, token } = useAuth();
  const [visible, setVisible] = useState(false);
  const [cerrado, setCerrado] = useState(false); // Por si el usuario lo cierra manualmente

  useEffect(() => {
    // Solo verificamos si el usuario está logueado
    if (isAuthenticated && token) {
      verificarCompras();
    } else {
      // Si NO está logueado, también mostramos el banner para invitarlo a registrarse
      setVisible(true);
    }
  }, [isAuthenticated, token]);

  const verificarCompras = async () => {
    try {
      // Reutilizamos la ruta de 'Mis Libros' para ver si tiene alguno
      const res = await api.get('/adquisiciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Si el array está vacío, es virgen de compras -> MOSTRAR BANNER
      if (res.data.length === 0) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch (error) {
      console.error("Error verificando promo", error);
    }
  };

  if (!visible || cerrado) return null;

  return (
    <ScaleFade initialScale={0.9} in={true}>
      <Box 
        bgGradient="linear(to-r, purple.600, pink.500)" 
        color="white" 
        py={3} 
        px={4} 
        position="relative"
        boxShadow="md"
        mb={6} // Margen inferior para separar del contenido
        borderRadius={{ base: 0, md: 'lg' }} // Bordes redondos en PC, cuadrados en móvil
        mx={{ base: 0, md: 4 }} // Margen lateral en PC
        mt={{ base: 0, md: 4 }}
      >
        <Container maxW="container.xl">
          <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
            
            {/* Texto e Icono */}
            <Flex align="center" gap={3}>
              <Box bg="whiteAlpha.300" p={2} borderRadius="full">
                <Icon as={isAuthenticated ? FaGift : FaPercentage} w={5} h={5} />
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                  {isAuthenticated 
                    ? "¡Regalo de Bienvenida! Tienes un 50% OFF en tu primera compra." 
                    : "¡Oferta Especial! Regístrate y obtén 50% OFF en tu primer libro."}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.800">
                  Aprovecha esta oportunidad para empezar tu biblioteca.
                </Text>
              </Box>
            </Flex>

            {/* Botón de Acción */}
            <Flex align="center" gap={4}>
              <Button
                as={RouterLink}
                to={isAuthenticated ? "/catalogo" : "/registro"}
                size="sm"
                bg="white"
                color="purple.600"
                fontWeight="bold"
                _hover={{ bg: 'gray.100' }}
              >
                {isAuthenticated ? "Ver Catálogo" : "Crear Cuenta"}
              </Button>
              
              <CloseButton onClick={() => setCerrado(true)} />
            </Flex>

          </Flex>
        </Container>
      </Box>
    </ScaleFade>
  );
}