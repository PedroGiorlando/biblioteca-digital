import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Button, HStack, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea, useDisclosure, VStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup, InputLeftElement, Image, useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { SearchIcon } from '@chakra-ui/icons';

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  descripcion: string | null;
  fecha_publicacion: string | null;
  portada_url: string | null;
}

type LibroForm = Omit<Libro, 'id' | 'fecha_publicacion' | 'portada_url'> & { fecha_publicacion: string };

const initialState: LibroForm = {
  titulo: '',
  autor: '',
  categoria: '',
  descripcion: '',
  fecha_publicacion: ''
};

export default function Gestionlibros() {
  const [libros, setlibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [libroseleccionado, setlibroseleccionado] = useState<Libro | null>(null);
  const [formData, setFormData] = useState<LibroForm>(initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  
  // --- COLORES MODO OSCURO ---
  const bgTable = useColorModeValue('white', 'gray.800');
  const colorTexto = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgInput = useColorModeValue('white', 'gray.700');
  const bgHover = useColorModeValue('gray.50', 'gray.700');
  const bgHeader = useColorModeValue('gray.50', 'gray.900');

  // --- NUEVOS ESTADOS PARA ARCHIVO ---
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();
  const toast = useToast();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const fetchlibros = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', busqueda);
      params.append('page', currentPage.toString());

      const response = await api.get(`/libros?${params.toString()}`);
      
      setlibros(response.data.libros);
      setTotalPages(response.data.totalPages);

    } catch (error) {
      toast({ title: 'Error al cargar libros', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchlibros();
  }, [token, currentPage, busqueda]);

  const abrirAlertaBorrado = (libro: Libro) => {
    setlibroseleccionado(libro);
    onDeleteAlertOpen();
  };

  const handleBorrar = async () => {
    if (!libroseleccionado) return;
    try {
      await api.delete(`/libros/${libroseleccionado.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast({ title: 'Libro eliminado (baja lógica)', status: 'success', duration: 3000, isClosable: true });
      onDeleteAlertClose();
      if (libros.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchlibros();
      }
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.response?.data?.error, status: 'error', duration: 5000, isClosable: true });
      onDeleteAlertClose();
    }
  };

  const abrirModalEditar = (libro: Libro) => {
    const fecha = libro.fecha_publicacion ? new Date(libro.fecha_publicacion).toISOString().split('T')[0] : '';
    setlibroseleccionado(libro);
    setFormData({
        titulo: libro.titulo,
        autor: libro.autor,
        categoria: libro.categoria,
        descripcion: libro.descripcion,
        fecha_publicacion: fecha
    });
    setFile(null);
    onEditModalOpen();
  };

  const abrirModalCrear = () => {
    setlibroseleccionado(null);
    setFormData(initialState);
    setFile(null);
    onEditModalOpen();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
    }
  };

  const handleGuardar = async () => {
    try {
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('autor', formData.autor);
      data.append('categoria', formData.categoria || '');
      data.append('descripcion', formData.descripcion || '');
      data.append('fecha_publicacion', formData.fecha_publicacion);
      
      if (file) {
        data.append('portada', file);
      }

      const config = {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      };

      if (libroseleccionado) {
        await api.put(`/libros/${libroseleccionado.id}`, data, config);
        toast({ title: 'Libro actualizado', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/libros', data, config);
        toast({ title: 'Libro creado', status: 'success', duration: 3000, isClosable: true });
      }
      onEditModalClose();
      fetchlibros();
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error.response?.data?.error, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handlePaginaSiguiente = () => { setCurrentPage((prevPage) => prevPage + 1); };
  const handlePaginaAnterior = () => { setCurrentPage((prevPage) => prevPage - 1); };
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

 return (
    <Box maxW="container.xl" mx="auto">
      
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Heading>Gestión de libros</Heading>
        <Button colorScheme="blue" onClick={abrirModalCrear} leftIcon={<FaPlus />}>
          Crear Nuevo Libro
        </Button>
      </Flex>

      <Box mb={6}>
        <InputGroup maxW={{ base: '100%', md: '400px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            bg={bgInput}
            borderColor={borderColor}
            color={colorTexto}
            placeholder="Buscar por título, autor o categoría..."
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </InputGroup>
      </Box>

      <Box bg={bgTable} color={colorTexto} shadow="sm" borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden">
        
        {loading ? (
           <Box textAlign="center" py={10}><Spinner size="xl" /></Box>
        ) : !loading && libros.length === 0 ? (
           <Box textAlign="center" py={10}>
             <Text fontSize="xl" color="gray.500">
               {busqueda ? 'No se encontraron libros.' : 'No hay libros registrados.'}
             </Text>
           </Box>
        ) : (
           <Box overflowX="auto">
             <TableContainer>
               <Table variant="simple">
                 <Thead bg={bgHeader}> 
                   <Tr>
                     <Th color={colorTexto} borderColor={borderColor}>ID</Th>
                     <Th color={colorTexto} borderColor={borderColor}>Portada</Th>
                     <Th color={colorTexto} borderColor={borderColor}>Título</Th>
                     <Th color={colorTexto} borderColor={borderColor}>Autor</Th>
                     <Th color={colorTexto} borderColor={borderColor}>Acciones</Th>
                   </Tr>
                 </Thead>
                 <Tbody>
                   {libros.map((libro) => (
                     <Tr key={libro.id} _hover={{ bg: bgHover }}> 
                       <Td borderColor={borderColor}>{libro.id}</Td>
                       <Td borderColor={borderColor}>
                         {libro.portada_url ? (
                           <Image 
                             src={libro.portada_url.startsWith('http') ? libro.portada_url : `http://localhost:3000/${libro.portada_url}`} 
                             alt="Portada" 
                             boxSize="50px" 
                             objectFit="cover" 
                             borderRadius="md"
                             fallbackSrc="https://via.placeholder.com/50?text=?"
                           />
                         ) : (
                           <Flex 
                             w="50px" h="50px" 
                             bg={useColorModeValue('gray.100', 'gray.600')} 
                             borderRadius="md" 
                             align="center" 
                             justify="center"
                           >
                              <Text fontSize="xs" color="gray.400">N/A</Text>
                           </Flex>
                         )}
                       </Td>
                       <Td borderColor={borderColor} fontWeight="medium">{libro.titulo}</Td>
                       <Td borderColor={borderColor}>{libro.autor}</Td>
                       <Td borderColor={borderColor}>
                         <HStack spacing={2}>
                           <Button colorScheme="yellow" variant="solid" size="sm" onClick={() => abrirModalEditar(libro)} leftIcon={<FaEdit />}>
                              Editar
                           </Button>
                           <Button colorScheme="red" variant="ghost" size="sm" onClick={() => abrirAlertaBorrado(libro)} leftIcon={<FaTrash />}>
                              Borrar
                           </Button>
                         </HStack>
                       </Td>
                     </Tr>
                   ))}
                 </Tbody>
               </Table>
             </TableContainer>
           </Box>
        )}

        {totalPages > 1 && (
           <Flex justify="center" p={4} borderTopWidth="1px" borderColor={borderColor} bg={bgHeader}>
             <HStack spacing={4}>
               <Button size="sm" onClick={handlePaginaAnterior} isDisabled={currentPage === 1}>
                 Anterior
               </Button>
               <Text fontSize="sm">Página {currentPage} de {totalPages}</Text>
               <Button size="sm" onClick={handlePaginaSiguiente} isDisabled={currentPage === totalPages}>
                 Siguiente
               </Button>
             </HStack>
           </Flex>
        )}
      </Box>

      {/* Modales */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent bg={bgTable} color={colorTexto}> 
          <ModalHeader>{libroseleccionado ? 'Editar Libro' : 'Crear Libro'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Portada del Libro</FormLabel>
                <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    ref={fileInputRef}
                    p={1} 
                    bg={bgInput} 
                    borderColor={borderColor}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>Opcional.</Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Título</FormLabel>
                <Input name="titulo" value={formData.titulo} onChange={handleFormChange} bg={bgInput} borderColor={borderColor}/>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Autor</FormLabel>
                <Input name="autor" value={formData.autor} onChange={handleFormChange} bg={bgInput} borderColor={borderColor}/>
              </FormControl>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Input name="categoria" value={formData.categoria || ''} onChange={handleFormChange} bg={bgInput} borderColor={borderColor}/>
              </FormControl>
              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea name="descripcion" value={formData.descripcion || ''} onChange={handleFormChange} bg={bgInput} borderColor={borderColor}/>
              </FormControl>
              <FormControl>
                <FormLabel>Fecha Publicación</FormLabel>
                <Input type="date" name="fecha_publicacion" value={formData.fecha_publicacion || ''} onChange={handleFormChange} bg={bgInput} borderColor={borderColor}/>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleGuardar}>Guardar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={bgTable} color={colorTexto}> {/* Corregido */}
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Libro
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>Cancelar</Button>
              <Button colorScheme="red" onClick={handleBorrar} ml={3}>Eliminar</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}