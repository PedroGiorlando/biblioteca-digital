import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  Box, Heading, Text, Image, Spinner, Alert, AlertIcon, SimpleGrid, Tag, Stack,
  Button, useToast, Icon, Divider, VStack, Textarea, Avatar, HStack, IconButton, Tooltip,
  useColorModeValue // <-- Importante para el modo oscuro
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaHeart, FaRegHeart, FaStar } from 'react-icons/fa';
import Estrellas from '../components/Estrellas';

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  descripcion: string | null;
  fecha_publicacion: string | null;
  portada_url: string | null;
}
interface Resena {
  id: number;
  autor_resena: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}
interface MisPrestamos {
  id_libro: number;
  estado: 'Activo' | 'Devuelto' | 'Vencido';
}

function LibroDetalle() {
  const [libro, setLibro] = useState<Libro | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tienePrestamoActivo, setTienePrestamoActivo] = useState(false);
  const [esDeseado, setEsDeseado] = useState(false);
  const [loadingDeseado, setLoadingDeseado] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [enviandoResena, setEnviandoResena] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();

  // --- COLORES DINÁMICOS (PARA MODO OSCURO) ---
  // 1. Fondo de las cajas (Formulario y Comentarios)
  //    Día: gris muy suave o blanco | Noche: gris oscuro (700)
  const bgCaja = useColorModeValue('gray.50', 'gray.700');
  const bgComentario = useColorModeValue('white', 'gray.700');
  
  // 2. Fondo de los inputs (Textarea)
  //    Día: blanco | Noche: gris un poco más claro que la caja (600)
  const bgInput = useColorModeValue('white', 'gray.600');

  // 3. Color del texto
  //    Día: gris oscuro | Noche: gris claro
  const colorTexto = useColorModeValue('gray.600', 'gray.300');
  const colorFecha = useColorModeValue('gray.500', 'gray.400');
  
  // 4. Borde
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // --- CARGA DE DATOS ---
  const fetchResenas = async () => {
    try {
      const response = await api.get(`/resenas/${id}`);
      setResenas(response.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchLibro = async () => {
      try {
        const response = await api.get(`/libros/${id}`);
        setLibro(response.data);
      } catch (err) { setError('No se pudo cargar el libro.'); }
    };

    const checkPrestamoStatus = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const response = await api.get<MisPrestamos[]>('/prestamos/mis-prestamos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const activo = response.data.some(p => p.id_libro === Number(id) && p.estado === 'Activo');
        setTienePrestamoActivo(activo);
      } catch (e) { console.error(e); }
    };

    const checkDeseado = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const response = await api.get(`/deseados/check/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEsDeseado(response.data.esDeseado);
      } catch (e) { console.error(e); }
    };

    setLoading(true);
    Promise.all([fetchLibro(), checkPrestamoStatus(), checkDeseado(), fetchResenas()])
      .finally(() => setLoading(false));

  }, [id, isAuthenticated, token]);

  // --- HANDLERS ---
  const handleSolicitarPrestamo = async () => {
    try {
        await api.post('/prestamos', { id_libro: id }, { headers: { 'Authorization': `Bearer ${token}` } });
        toast({ title: '¡Préstamo solicitado!', status: 'success' });
        setTienePrestamoActivo(true);
    } catch (err: any) {
        toast({ title: 'Error', description: err.response?.data?.error, status: 'error' });
    }
  };

  const handleToggleDeseado = async () => {
    if (!isAuthenticated) return;
    setLoadingDeseado(true);
    try {
      const response = await api.post('/deseados', { id_libro: id }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEsDeseado(response.data.esDeseado);
      toast({ title: response.data.mensaje, status: response.data.esDeseado ? 'success' : 'info', duration: 2000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error al actualizar deseados', status: 'error' });
    } finally {
      setLoadingDeseado(false);
    }
  };

  const handleEnviarResena = async () => {
    if (nuevaCalificacion === 0) {
        toast({ title: 'Por favor selecciona una calificación', status: 'warning' });
        return;
    }
    setEnviandoResena(true);
    try {
        await api.post('/resenas', { id_libro: id, calificacion: nuevaCalificacion, comentario: nuevoComentario }, 
        { headers: { 'Authorization': `Bearer ${token}` } });
        toast({ title: 'Reseña publicada', status: 'success' });
        setNuevoComentario('');
        setNuevaCalificacion(0);
        fetchResenas();
    } catch (error: any) {
        toast({ title: 'Error', description: error.response?.data?.error, status: 'error' });
    } finally {
        setEnviandoResena(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={20}><Spinner size="xl" /></Box>;
  if (error) return <Alert status="error">{error}</Alert>;
  if (!libro) return <Heading>Libro no encontrado.</Heading>;

  return (
    <Box maxW="container.lg" mx="auto" mt={10} p={5}>
      {/* --- PARTE SUPERIOR (LIBRO) --- */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={16}>
        <Box>
          {libro.portada_url ? (
            <Image 
              src={libro.portada_url.startsWith('http') ? libro.portada_url : `http://localhost:3000/${libro.portada_url}`} 
              borderRadius="md" shadow="lg" objectFit="cover" w="100%" 
            />
          ) : (
             <Box w="100%" h="450px" bg="gray.100" display="flex" alignItems="center" justifyContent="center" borderRadius="md"><Icon as={FaBook} boxSize="100px" color="gray.400" /></Box>
          )}
        </Box>

        <Stack spacing={4}>
          <Heading as="h1" size="xl">{libro.titulo}</Heading>
          <Text fontSize="2xl" color={colorTexto}>por {libro.autor}</Text>
          <Tag size="lg" colorScheme="teal" w="fit-content">{libro.categoria || 'Sin Categoría'}</Tag>
          <Text fontSize="lg" mt={4} color={colorTexto}>{libro.descripcion}</Text>
          
          {isAuthenticated && (
            <HStack spacing={4} mt={6}>
              <Button
                flex="1" colorScheme={tienePrestamoActivo ? 'green' : 'blue'} size="lg"
                onClick={handleSolicitarPrestamo} isDisabled={tienePrestamoActivo}
              >
                {tienePrestamoActivo ? 'Préstamo Activo' : 'Solicitar Préstamo'}
              </Button>
              <Tooltip label={esDeseado ? "Quitar de deseados" : "Agregar a deseados"}>
                <IconButton
                  aria-label="Deseados" icon={esDeseado ? <Icon as={FaHeart} color="red.500" /> : <Icon as={FaRegHeart} />}
                  size="lg" variant="outline" colorScheme="red"
                  onClick={handleToggleDeseado} isLoading={loadingDeseado}
                />
              </Tooltip>
            </HStack>
          )}
        </Stack>
      </SimpleGrid>

      <Divider mb={10} borderColor={borderColor} />

      {/* --- PARTE INFERIOR (RESEÑAS) --- */}
      <Box>
        <Heading size="lg" mb={6}>Opiniones de los Lectores</Heading>

        {isAuthenticated ? (
            <Box bg={bgCaja} p={6} borderRadius="md" mb={10} borderWidth="1px" borderColor={borderColor}>
                <Text fontWeight="bold" mb={2}>Deja tu opinión</Text>
                <HStack mb={4}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                            as={FaStar} key={star} boxSize={6} cursor="pointer"
                            color={star <= nuevaCalificacion ? "yellow.400" : "gray.300"}
                            onClick={() => setNuevaCalificacion(star)}
                            _hover={{ transform: 'scale(1.2)', transition: '0.2s' }}
                        />
                    ))}
                </HStack>
                <Textarea 
                    placeholder="¿Qué te pareció este libro?" 
                    bg={bgInput} // Fondo dinámico para el input
                    mb={4}
                    value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)}
                />
                <Button colorScheme="blue" onClick={handleEnviarResena} isLoading={enviandoResena}>
                    Publicar Reseña
                </Button>
            </Box>
        ) : (
            <Alert status="info" mb={10}><AlertIcon /> Inicia sesión para dejar una reseña.</Alert>
        )}

        {resenas.length === 0 ? (
            <Text color="gray.500">Aún no hay opiniones. ¡Sé el primero en comentar!</Text>
        ) : (
            <VStack align="stretch" spacing={4}>
                {resenas.map((resena) => (
                    <Box 
                      key={resena.id} 
                      p={5} 
                      borderWidth="1px" 
                      borderRadius="md" 
                      bg={bgComentario} // Fondo dinámico para el comentario
                      borderColor={borderColor}
                      boxShadow="sm"
                    >
                        <HStack justifyContent="space-between" mb={2}>
                            <HStack>
                                <Avatar size="xs" name={resena.autor_resena} />
                                <Text fontWeight="bold">{resena.autor_resena}</Text>
                            </HStack>
                            <Text fontSize="sm" color={colorFecha}>
                                {new Date(resena.fecha).toLocaleDateString()}
                            </Text>
                        </HStack>
                        <Estrellas calificacion={resena.calificacion} size="sm" />
                        
                        {/* El texto ahora usa colorTexto (se ve en oscuro y claro) */}
                        <Text mt={3} color={colorTexto}>
                            {resena.comentario}
                        </Text>
                    </Box>
                ))}
            </VStack>
        )}
      </Box>
    </Box>
  );
}
export default LibroDetalle;