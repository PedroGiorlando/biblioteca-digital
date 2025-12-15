import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Heading, Spinner, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Button, HStack, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Textarea, useDisclosure, VStack,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup, InputLeftElement, Image // Importar Image para previsualizar
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

// En el formulario ya no pedimos 'portada_url' como texto, eso lo maneja el input file
type LibroForm = Omit<Libro, 'id' | 'fecha_publicacion' | 'portada_url'> & { fecha_publicacion: string };

const initialState: LibroForm = {
  titulo: '',
  autor: '',
  categoria: '',
  descripcion: '',
  fecha_publicacion: ''
};

function GestionLibros() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [libroSeleccionado, setLibroSeleccionado] = useState<Libro | null>(null);
  const [formData, setFormData] = useState<LibroForm>(initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  
  // --- NUEVOS ESTADOS PARA ARCHIVO ---
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // -----------------------------------

  const { token } = useAuth();
  const toast = useToast();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const fetchLibros = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', busqueda);
      params.append('page', currentPage.toString());

      const response = await api.get(`/libros?${params.toString()}`);
      
      setLibros(response.data.libros);
      setTotalPages(response.data.totalPages);

    } catch (error) {
      toast({ title: 'Error al cargar libros', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLibros();
  }, [token, currentPage, busqueda]);

  // Lógica de Borrado (Igual)
  const abrirAlertaBorrado = (libro: Libro) => {
    setLibroSeleccionado(libro);
    onDeleteAlertOpen();
  };

  const handleBorrar = async () => {
    if (!libroSeleccionado) return;
    try {
      await api.delete(`/libros/${libroSeleccionado.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast({ title: 'Libro eliminado (baja lógica)', status: 'success', duration: 3000, isClosable: true });
      onDeleteAlertClose();
      if (libros.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchLibros();
      }
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.response?.data?.error, status: 'error', duration: 5000, isClosable: true });
      onDeleteAlertClose();
    }
  };

  // --- LÓGICA DE CREAR/EDITAR CON FOTO ---

  const abrirModalEditar = (libro: Libro) => {
    const fecha = libro.fecha_publicacion ? new Date(libro.fecha_publicacion).toISOString().split('T')[0] : '';
    setLibroSeleccionado(libro);
    setFormData({
        titulo: libro.titulo,
        autor: libro.autor,
        categoria: libro.categoria,
        descripcion: libro.descripcion,
        fecha_publicacion: fecha
    });
    setFile(null); // Limpiar archivo anterior
    onEditModalOpen();
  };

  const abrirModalCrear = () => {
    setLibroSeleccionado(null);
    setFormData(initialState);
    setFile(null); // Limpiar archivo anterior
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
      // 1. Usamos FormData en lugar de JSON
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('autor', formData.autor);
      data.append('categoria', formData.categoria || '');
      data.append('descripcion', formData.descripcion || '');
      data.append('fecha_publicacion', formData.fecha_publicacion);
      
      if (file) {
        data.append('portada', file); // 'portada' debe coincidir con upload.single('portada')
      }

      // Configuración de headers para multipart
      const config = {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      };

      if (libroSeleccionado) {
        await api.put(`/libros/${libroSeleccionado.id}`, data, config);
        toast({ title: 'Libro actualizado', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/libros', data, config);
        toast({ title: 'Libro creado', status: 'success', duration: 3000, isClosable: true });
      }
      onEditModalClose();
      fetchLibros();
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
    <Box>
      <HStack justifyContent="space-between" mb={6}>
        <Heading>Gestión de Libros</Heading>
        <Button colorScheme="blue" onClick={abrirModalCrear} leftIcon={<FaPlus />}>
          Crear Nuevo Libro
        </Button>
      </HStack>

      <Box mb={6}>
        <InputGroup w={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por título, autor o categoría..."
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </InputGroup>
      </Box>

      {loading ? (
        <Box textAlign="center" py={10}><Spinner size="xl" /></Box>
      ) : !loading && libros.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" color="gray.500">
            {busqueda ? 'No se encontraron libros.' : 'No hay libros registrados.'}
          </Text>
        </Box>
      ) : (
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Portada</Th> {/* Nueva columna */}
                <Th>Título</Th>
                <Th>Autor</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {libros.map((libro) => (
                <Tr key={libro.id}>
                  <Td>{libro.id}</Td>
                    <Td>
                      {libro.portada_url ? (
                      <Image 
            // Lógica inteligente: Si ya tiene http, úsalo. Si no, agrega localhost.
            src={libro.portada_url.startsWith('http') ? libro.portada_url : `http://localhost:3000/${libro.portada_url}`} 
            alt="Portada" 
            boxSize="50px" 
            objectFit="cover" 
            borderRadius="md"
          />
        ) : (
          <Text fontSize="xs" color="gray.400">Sin Foto</Text>
        )}
      </Td>
      <Td>{libro.titulo}</Td>
      <Td>{libro.autor}</Td>
      <Td>
        <HStack spacing={2}>
          <Button colorScheme="yellow" size="sm" onClick={() => abrirModalEditar(libro)} leftIcon={<FaEdit />}>Editar</Button>
          <Button colorScheme="red" size="sm" onClick={() => abrirAlertaBorrado(libro)} leftIcon={<FaTrash />}>Borrar</Button>
        </HStack>
      </Td>
    </Tr>
  ))}
</Tbody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <HStack justifyContent="center" mt={10} spacing={4}>
          <Button onClick={handlePaginaAnterior} isDisabled={currentPage === 1}>Anterior</Button>
          <Text>Página {currentPage} de {totalPages}</Text>
          <Button onClick={handlePaginaSiguiente} isDisabled={currentPage === totalPages}>Siguiente</Button>
        </HStack>
      )}

      {/* MODAL DE CREAR/EDITAR */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{libroSeleccionado ? 'Editar Libro' : 'Crear Libro'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              
              {/* INPUT PARA SUBIR FOTO */}
              <FormControl>
                <FormLabel>Portada del Libro</FormLabel>
                <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    ref={fileInputRef}
                    p={1} // Padding pequeño para que se vea bien el input file
                />
                <Text fontSize="xs" color="gray.500" mt={1}>Opcional. Deja vacío para mantener la actual.</Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Título</FormLabel>
                <Input name="titulo" value={formData.titulo} onChange={handleFormChange} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Autor</FormLabel>
                <Input name="autor" value={formData.autor} onChange={handleFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Input name="categoria" value={formData.categoria || ''} onChange={handleFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea name="descripcion" value={formData.descripcion || ''} onChange={handleFormChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Fecha Publicación</FormLabel>
                <Input type="date" name="fecha_publicacion" value={formData.fecha_publicacion || ''} onChange={handleFormChange} />
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
          <AlertDialogContent>
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

export default GestionLibros;