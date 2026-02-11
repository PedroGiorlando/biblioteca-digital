import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Input, InputGroup, InputLeftElement,
  Flex, useToast, Spinner, Avatar, Select,
  HStack, Button, Text, TableContainer, Tag, useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Usuario Registrado';
  foto_url?: string;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { token, user: adminUser } = useAuth();
  const toast = useToast();

  // --- COLORES MODO OSCURO ---
  const bgTable = useColorModeValue('white', 'gray.800');
  const colorTexto = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgInput = useColorModeValue('white', 'gray.700');
  const bgHeader = useColorModeValue('gray.50', 'gray.900');

  const cargarUsuarios = async (page = 1, termino = '') => {
    setLoading(true);
    try {
      const res = await api.get('/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: termino, page: page } 
      });

      if (res.data.usuarios) {
          setUsuarios(res.data.usuarios);
          setTotalPages(res.data.totalPages || 1);
      } else {
          setUsuarios(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast({ title: 'Error cargando usuarios', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(currentPage, busqueda);
  }, [currentPage, busqueda]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleRolChange = async (e: React.ChangeEvent<HTMLSelectElement>, idUsuario: number) => {
    const nuevoRol = e.target.value;
    const backupUsuarios = [...usuarios];
    setUsuarios(usuarios.map(u => u.id === idUsuario ? { ...u, rol: nuevoRol as any } : u));

    try {
        await api.put(`/usuarios/${idUsuario}`, 
            { rol: nuevoRol }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: 'Rol actualizado', status: 'success', duration: 2000 });
    } catch (error: any) {
        setUsuarios(backupUsuarios);
        toast({ title: 'Error al cambiar rol', status: 'error' });
    }
  };

  return (
    <Box maxW="container.xl" mx="auto">
      <Heading mb={6}>Gestión de Usuarios</Heading>

      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={busqueda}
            onChange={handleSearchChange}
            bg={bgInput}
            borderColor={borderColor}
            color={colorTexto}
          />
        </InputGroup>
      </Flex>

      <Box overflowX="auto" borderWidth="1px" borderRadius="lg" bg={bgTable} color={colorTexto} borderColor={borderColor} shadow="sm">
        <TableContainer>
            <Table variant="simple">
            <Thead bg={bgHeader}> 
                <Tr>
                <Th color={colorTexto} borderColor={borderColor}>Usuario</Th>
                <Th color={colorTexto} borderColor={borderColor}>Email</Th>
                <Th color={colorTexto} borderColor={borderColor}>Rol</Th>
                </Tr>
            </Thead>
            <Tbody>
                {loading ? (
                    <Tr><Td colSpan={3} textAlign="center" py={10}><Spinner size="xl" /></Td></Tr>
                ) : (
                    usuarios.map((u) => (
                    <Tr key={u.id}>
                        <Td borderColor={borderColor}>
                            <Flex align="center">
                                <Avatar size="sm" name={u.nombre} src={u.foto_url} mr={3} />
                                <Text fontWeight="medium">{u.nombre}</Text>
                            </Flex>
                        </Td>
                        <Td borderColor={borderColor}>{u.email}</Td>
                        <Td borderColor={borderColor}>
                            {adminUser?.id === u.id ? (
                                <Tag colorScheme="purple" size="md">Tú (Admin)</Tag>
                            ) : (
                                <Select 
                                    size="sm" 
                                    value={u.rol} 
                                    onChange={(e) => handleRolChange(e, u.id)}
                                    maxW="150px"
                                    bg={bgInput} 
                                    borderColor={borderColor}
                                    color={colorTexto}
                                >
                                    <option value="Usuario Registrado">Usuario</option>
                                    <option value="Administrador">Administrador</option>
                                </Select>
                            )}
                        </Td>
                    </Tr>
                    ))
                )}
                {!loading && usuarios.length === 0 && (
                    <Tr><Td colSpan={3} textAlign="center" py={10}>No se encontraron usuarios.</Td></Tr>
                )}
            </Tbody>
            </Table>
        </TableContainer>
      </Box>

      {totalPages > 1 && (
        <HStack justifyContent="center" mt={6} spacing={4}>
          <Button onClick={handlePrevPage} isDisabled={currentPage === 1} size="sm">
            Anterior
          </Button>
          <Text fontSize="sm" color="gray.600">
            Página {currentPage} de {totalPages}
          </Text>
          <Button onClick={handleNextPage} isDisabled={currentPage === totalPages} size="sm">
            Siguiente
          </Button>
        </HStack>
      )}
    </Box>
  );
}