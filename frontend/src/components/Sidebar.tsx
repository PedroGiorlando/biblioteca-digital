import { Box, VStack, Link, Heading, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function Sidebar() {
  // --- COLORES DINÁMICOS ---
  // Fondo: Gris claro en día | Gris muy oscuro (casi negro) en noche
  const bgSidebar = useColorModeValue('gray.100', 'gray.900');
  
  // Borde derecho: Para separar el menú del contenido
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Color del link al pasar el mouse
  const hoverColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Box
      bg={bgSidebar}        // <-- Fondo dinámico
      w="250px"
      h="100vh"
      p={5}
      borderRight="1px"
      borderColor={borderColor} // <-- Borde dinámico
    >
      <VStack align="stretch" spacing={4}>
        <Heading size="md" mb={6}>
          Panel de Admin
        </Heading>
        
        <Link as={RouterLink} to="/admin/usuarios" fontWeight="medium" _hover={{ color: hoverColor, textDecoration: 'none' }}>
          Gestión de usuarios
        </Link>
        
        <Link as={RouterLink} to="/admin/prestamos" fontWeight="medium" _hover={{ color: hoverColor, textDecoration: 'none' }}>
          Gestión de Préstamos
        </Link>
        
        <Link as={RouterLink} to="/admin/libros" fontWeight="medium" _hover={{ color: hoverColor, textDecoration: 'none' }}>
          Gestión de libros
        </Link>
        
        <Link as={RouterLink} to="/admin/reportes" fontWeight="medium" _hover={{ color: hoverColor, textDecoration: 'none' }}>
          Reportes
        </Link>
        
        <Link as={RouterLink} to="/" color={useColorModeValue('blue.600', 'blue.400')} mt={10} fontWeight="bold">
          ← Volver al sitio
        </Link>
      </VStack>
    </Box>
  );
}

export default Sidebar;