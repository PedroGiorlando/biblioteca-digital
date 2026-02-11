import {
  IconButton, Avatar, Box, CloseButton, Flex, HStack,
  VStack, Icon, useColorModeValue, Text, Drawer,
  DrawerContent, useDisclosure, Menu, MenuButton, MenuList, MenuItem, MenuDivider
} from '@chakra-ui/react';
import {
  FiHome, FiUsers, FiSettings, FiMenu, FiBell, 
  FiChevronDown, FiBook, FiDollarSign, FiBarChart2 
} from 'react-icons/fi'; 
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LinkItems = [
  { name: 'Dashboard', icon: FiHome, path: '/admin' },
  { name: 'Usuarios', icon: FiUsers, path: '/admin/usuarios' },
  { name: 'Libros', icon: FiBook, path: '/admin/libros' },
  { name: 'Ventas', icon: FiDollarSign, path: '/admin/ventas' }, 
  { name: 'Reportes', icon: FiBarChart2, path: '/admin/reportes' },
];

export default function AdminLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* Mobile Nav */}
      <MobileNav onOpen={onOpen} display={{ base: 'flex', md: 'none' }} />
      
      {/* Contenido Principal */}
      <Box ml={{ base: 0, md: 60 }} p="4">
        <Outlet /> {/* Aquí se renderizan las páginas hijas (Dashboard, Usuarios, etc) */}
      </Box>
    </Box>
  );
}

const SidebarContent = ({ onClose, ...rest }: any) => {
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
          Admin
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} path={link.path}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

const NavItem = ({ icon, children, path, ...rest }: any) => {
  return (
    <RouterLink to={path} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        {...rest}>
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </RouterLink>
  );
};

const MobileNav = ({ onOpen, ...rest }: any) => {
    const navigate = useNavigate();

    return (
      <Flex
        ml={{ base: 0, md: 60 }}
        px={{ base: 4, md: 4 }}
        height="20"
        alignItems="center"
        bg={useColorModeValue('white', 'gray.900')}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        justifyContent={{ base: 'space-between', md: 'flex-end' }}
        {...rest}>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<FiMenu />}
        />
  
        <Text
          display={{ base: 'flex', md: 'none' }}
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold">
        </Text>
      </Flex>
    );
  };

