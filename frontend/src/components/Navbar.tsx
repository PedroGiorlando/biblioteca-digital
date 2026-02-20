import {
  Box, Flex, Text, IconButton, Button, Stack, Collapse, Icon,
  useColorModeValue, useDisclosure, useColorMode, Avatar,
  Menu, MenuButton, MenuList, MenuItem, MenuDivider, Container, Image, Divider, HStack, VStack
} from '@chakra-ui/react';
import {
  HamburgerIcon, CloseIcon, MoonIcon, SunIcon
} from '@chakra-ui/icons';
import { FaStore, FaBook, FaHeart, FaUser, FaSignOutAlt, FaUserCog } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Esta función revisa si la foto viene del backend o si es externa
const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return undefined; 
  return path.startsWith('http') ? path : `https://biblioteca-digital-fi5y.onrender.com/${path}`;
};

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const bgNavbar = useColorModeValue('brand.800', 'gray.900');
  const colorTexto = 'white';
  const hoverBg = useColorModeValue('whiteAlpha.200', 'whiteAlpha.200');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box position="sticky" top={0} zIndex={100}>
      <Flex
        bg={bgNavbar}
        color={colorTexto}
        minH={'60px'}
        py={2}
        px={{ base: 4, md: 8 }}
        align={'center'}
        justify={'space-between'}
        boxShadow="md"
        borderBottom="1px solid"
        borderColor="whiteAlpha.300"
      >
        {/* 1. LOGO */}
        <Flex align="center" cursor="pointer" onClick={() => navigate('/')}>
            <Image 
              src="/logo.png" 
              alt="Logo Biblioteca" 
              h="80px"
              objectFit="contain"
              mr={3} 
            />
            <Text
                fontFamily={'heading'}
                fontWeight="bold"
                fontSize="xl"
                display={{ base: 'none', sm: 'block' }}>
                Biblioteca Digital
            </Text>
        </Flex>

        {/* 2. MENÚ HAMBURGUESA (MÓVIL) */}
        <Flex display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            color="white"
            aria-label={'Toggle Navigation'}
            _hover={{ bg: hoverBg }}
          />
        </Flex>

        {/* 3. GRUPO DERECHO (DESKTOP) */}
        <Flex display={{ base: 'none', md: 'flex' }} align="center">
            
            <DesktopNav colorTexto={colorTexto} hoverBg={hoverBg} user={user} />

            <Box w="1px" h="30px" bg="whiteAlpha.400" mx={5} />

            {/* USUARIO Y TEMA */}
            <Stack direction={'row'} spacing={3}>
              <IconButton
                size="md"
                variant="ghost"
                aria-label="Cambiar tema"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                color={colorTexto}
                _hover={{ bg: hoverBg }}
              />

              {isAuthenticated ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}>
                    <Avatar
                        size={'sm'}
                        name={user?.nombre}
                        // 2. APLICAMOS LA FUNCIÓN AQUÍ
                        src={getAvatarUrl(user?.foto_url)}
                        bg="white"
                        color="brand.800"
                        border="2px solid white"
                    />
                  </MenuButton>
                  <MenuList alignItems={'center'} color="gray.800" zIndex={200}>
                    <Container centerContent py={3}>
                        <Avatar 
                            size={'lg'} 
                            name={user?.nombre} 
                            // 3. Y TAMBIÉN AQUÍ ADENTRO
                            src={getAvatarUrl(user?.foto_url)}
                            bg="brand.800" 
                            color="white" 
                            mb={2}
                        />
                        <Text fontWeight="bold">{user?.nombre}</Text>
                        <Text fontSize="sm" color="gray.500">{user?.email}</Text>
                    </Container>
                    <MenuDivider />
                    <MenuItem icon={<FaUser />} onClick={() => navigate('/perfil')}>Mi Perfil</MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<FaSignOutAlt />} color="red.500" onClick={handleLogout}>Cerrar Sesión</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <>
                    <Button as={RouterLink} to="/login" fontSize={'sm'} fontWeight={400} variant={'link'} color="white">
                        Ingresar
                    </Button>
                    <Button
                        as={RouterLink} to="/registro"
                        display={{ base: 'none', md: 'inline-flex' }}
                        fontSize={'sm'}
                        fontWeight={600}
                        color={'brand.800'}
                        bg={'white'}
                        _hover={{ bg: 'gray.100' }}>
                        Registrarse
                    </Button>
                </>
              )}
            </Stack>
        </Flex>
      </Flex>

      {/* MENÚ MÓVIL */}
      <Collapse in={isOpen} animateOpacity>
        {/* Pasamos navigate y logout para que funcione el botón salir en móvil */}
        <MobileNav user={user} onLogout={handleLogout} />
      </Collapse>
    </Box>
  );
}

// --- COMPONENTES AUXILIARES ---

const NAV_ITEMS = [
  { label: 'Catálogo', icon: FaStore, href: '/catalogo' },
  { label: 'Mi Biblioteca', icon: FaBook, href: '/mi-biblioteca' },
  { label: 'deseados', icon: FaHeart, href: '/deseados' },
];

const DesktopNav = ({ colorTexto, hoverBg, user }: any) => {
  return (
    <Stack direction={'row'} spacing={1}>
      {NAV_ITEMS.map((navItem) => (
        <Button
          key={navItem.label}
          as={RouterLink}
          to={navItem.href}
          variant="ghost"
          size="md"
          fontWeight={500}
          color={colorTexto}
          leftIcon={<Icon as={navItem.icon} />}
          _hover={{ textDecoration: 'none', bg: hoverBg }}>
          {navItem.label}
        </Button>
      ))}

      {user?.rol === 'Administrador' && (
        <Button
          as={RouterLink}
          to="/admin"
          variant="solid"
          colorScheme="orange"
          size="md"
          leftIcon={<Icon as={FaUserCog} />}
        >
          Panel Admin
        </Button>
      )}
    </Stack>
  );
};

// Agregamos onLogout a las props
const MobileNav = ({ user, onLogout }: any) => {
  const bgMobile = useColorModeValue('white', 'gray.800');
  const colorMobile = useColorModeValue('gray.600', 'gray.200');
  const navigate = useNavigate();

  return (
    <Stack bg={bgMobile} p={4} display={{ md: 'none' }} borderBottomWidth="1px" shadow="md">
      
      {NAV_ITEMS.map((navItem) => (
        <Stack key={navItem.label} spacing={4}>
          <Flex
            py={2}
            as={RouterLink}
            to={navItem.href ?? '#'}
            justify={'space-between'}
            align={'center'}
            _hover={{ textDecoration: 'none' }}>
            <Stack direction="row" align="center">
                <Icon as={navItem.icon} color="brand.800"/>
                <Text fontWeight={600} color={colorMobile}>
                    {navItem.label}
                </Text>
            </Stack>
          </Flex>
        </Stack>
      ))}

      {user?.rol === 'Administrador' && (
        <Stack spacing={4}>
          <Flex
            py={2}
            as={RouterLink}
            to="/admin"
            justify={'space-between'}
            align={'center'}
            _hover={{ textDecoration: 'none' }}>
            <Stack direction="row" align="center">
                <Icon as={FaUserCog} color="orange.500"/>
                <Text fontWeight={600} color="orange.500">
                    Panel Admin
                </Text>
            </Stack>
          </Flex>
        </Stack>
      )}

      {/* SECCIÓN PERFIL MÓVIL */}
      <Box pt={4} mt={2}>
        <Divider borderColor="gray.300" mb={4} />
        
        <HStack spacing={3} mb={4} align="center">
          <Avatar 
            size="md" 
            name={user?.nombre} 
            // 4. Y FINALMENTE AQUÍ EN MÓVIL
            src={getAvatarUrl(user?.foto_url)} 
            border="2px solid"
            borderColor="brand.800"
          />
          <VStack align="start" spacing={0}>
             <Text fontWeight="bold" color={colorMobile}>{user?.nombre}</Text>
             <Text fontSize="xs" color="gray.500">{user?.email}</Text>
          </VStack>
        </HStack>

        <HStack spacing={2}>
            <Button 
                size="sm" 
                flex={1} 
                variant="outline" 
                colorScheme="blue" 
                leftIcon={<Icon as={FaUser} />}
                onClick={() => navigate('/perfil')}
            >
                Mi Perfil
            </Button>
            <Button 
                size="sm" 
                flex={1} 
                colorScheme="red" 
                leftIcon={<Icon as={FaSignOutAlt} />}
                onClick={onLogout} // Usamos la función pasada por props
            >
                Salir
            </Button>
        </HStack>
      </Box>

    </Stack>
  );
};