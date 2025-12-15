import { Flex, Spacer, Link, Heading, Button, Text, Image, HStack, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Avatar, Box, useColorMode, IconButton } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';

// Importar el Hook useAuth
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const { colorMode, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // CAMBIO: bg="brand.600" y color="white"
    <Flex as="nav" bg="brand.600" color="white" p={4} alignItems="center" boxShadow="md">
      
      <HStack 
        as={RouterLink} 
        to="/" 
        _hover={{ textDecoration: 'none', opacity: 0.9 }} // Efecto hover sutil
        spacing={3}
      >
        {/* CAMBIO: Fondo blanco para el logo para que resalte */}
        
            <Image
            src="/logo.png"
            alt="Logo"
            boxSize="64px"
            objectFit="contain"
            />
       
        <Heading size="md" letterSpacing="tight">
          Biblioteca Digital
        </Heading>
      </HStack>

      <Spacer />

      {/* Link de Catálogo (con hover mejorado) */}
      <Link 
        as={RouterLink} 
        to="/catalogo" 
        mr={6} 
        fontWeight="medium"
        _hover={{ color: 'brand.100' }} // Hover color claro
      >
        Catálogo
      </Link>

      {isAuthenticated ? (
        <Flex alignItems="center">
          {user?.rol === 'Administrador' && (
            <Link as={RouterLink} to="/admin" mr={4} fontWeight="bold" _hover={{ color: 'brand.100' }}>
              Panel Admin
            </Link>
          )}
          <Link as={RouterLink} to="/mis-prestamos" mr={6} _hover={{ color: 'brand.100' }}>
            Mis Préstamos
          </Link>
          <Link as={RouterLink} to="/deseados" mr={6}>Deseados ❤️</Link>

         <IconButton
        aria-label="Cambiar tema"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        variant="ghost"
        color="white" 
        _hover={{ bg: 'whiteAlpha.300' }} // Hover semitransparente
        mr={4}
        size="sm"
      />

          {/* MENÚ DE USUARIO (Adaptado a fondo oscuro) */}
          <Menu>
            <MenuButton 
              as={Button} 
              rightIcon={<ChevronDownIcon />} 
              variant="outline" // Botón con borde
              colorScheme="whiteAlpha" // Estilo para fondos oscuros
              size="sm"
              _hover={{ bg: 'brand.700' }}
              _active={{ bg: 'brand.800' }}
            >
              <HStack>
                <Avatar 
                  size="xs" 
                  name={user?.nombre} 
                  src={user?.foto_url ? (user.foto_url.startsWith('http') ? user.foto_url : `http://localhost:3000/${user.foto_url}`) : undefined}
                />
                <Text fontSize="sm" display={{ base: 'none', md: 'block' }}>{user?.nombre}</Text>
              </HStack>
            </MenuButton>
            {/* El menú desplegable sigue siendo blanco (por defecto), pero el texto dentro debe ser negro */}
            <MenuList color="gray.800">
              <MenuItem as={RouterLink} to="/perfil">Mi Perfil</MenuItem>
              <MenuDivider />
              <MenuItem onClick={handleLogout} color="red.500">Logout</MenuItem>
            </MenuList>
          </Menu>

        </Flex>
      ) : (
        <Flex gap={4}>
           {/* Botones con más estilo */}
          <Button as={RouterLink} to="/login" variant="ghost" colorScheme="whiteAlpha" size="sm">
            Login
          </Button>
          <Button as={RouterLink} to="/registro" bg="white" color="brand.600" size="sm" _hover={{ bg: 'brand.50' }}>
            Registrarse
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

export default Navbar;