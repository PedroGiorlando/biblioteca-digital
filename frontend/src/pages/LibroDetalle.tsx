import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  Box, Heading, Text, Image, Spinner, Alert, AlertIcon, SimpleGrid, Tag, Stack,
  Button, useToast, Icon, Divider, VStack, Textarea, Avatar, HStack, IconButton, Tooltip,
  useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  AspectRatio, Radio, RadioGroup, Checkbox 
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaHeart, FaRegHeart, FaStar, FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import Estrellas from '../components/Estrellas';

// --- IMPORTAMOS TU COMPONENTE ---
import LibroCard from '../components/LibroCard'; 

// --- INTERFACES ---
// Ajustamos la interfaz para que sea compatible con lo que espera LibroCard
interface Libro {
  id: number;
  titulo: string;
  autor: string;
  categoria: string | null;
  descripcion: string | null;
  fecha_publicacion: string | null;
  portada_url: string | null;
  precio?: string;
}

interface Resena {
  id: number;
  autor_resena: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

function LibroDetalle() {
  // --- ESTADOS ---
  const [libro, setLibro] = useState<Libro | null>(null);
  const [resenas, setresenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relacionados, setRelacionados] = useState<Libro[]>([]);

  // Estados de usuario
  const [loTengo, setLoTengo] = useState(false);
  const [esDeseado, setEsDeseado] = useState(false);
  const [loadingDeseado, setLoadingDeseado] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [enviandoResena, setEnviandoResena] = useState(false);

  // Estados de Compra
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [precioLibro, setPrecioLibro] = useState(15.00); 
  const [esPrimeraCompra, setEsPrimeraCompra] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Hooks
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, token } = useAuth();
  const toast = useToast();

  // Colores
  const bgCaja = useColorModeValue('gray.50', 'gray.700');
  const bgComentario = useColorModeValue('white', 'gray.700');
  const bgInput = useColorModeValue('white', 'gray.600');
  const colorTexto = useColorModeValue('gray.600', 'gray.300');
  const colorFecha = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgModal = useColorModeValue('white', 'gray.800');
  const bgTotal = useColorModeValue('blue.50', 'blue.900');
  const colorTotal = useColorModeValue('blue.800', 'blue.200');
  const bgTerminos = useColorModeValue('orange.50', 'rgba(237, 137, 54, 0.1)');

  // --- EFECTO DE CARGA ---
  useEffect(() => {
    if (!id) return;

    const cargarDatos = async () => {
      setLoading(true);
      // Reseteamos estados visuales al cambiar de libro
      window.scrollTo(0, 0); // Scrollear arriba al cambiar de libro
      setLibro(null);
      setRelacionados([]); 
      setLoTengo(false);
      
      try {
        // 1. Cargar Libro Principal
        const resLibro = await api.get(`/libros/${id}`);
        setLibro(resLibro.data);
        if (resLibro.data.precio) setPrecioLibro(parseFloat(resLibro.data.precio));

        // 2. Cargar Reseñas
        try {
            const resresenas = await api.get(`/resenas/${id}`);
            setresenas(resresenas.data);
        } catch (e) { console.error("Error reseñas", e); }

        // 3. Cargar RELACIONADOS
        try {
            const resRel = await api.get(`/libros/${id}/relacionados`);
            setRelacionados(resRel.data);
        } catch (e) { console.error("Error relacionados", e); }

        // 4. Datos de Usuario
        if (isAuthenticated && token) {
          const config = { headers: { 'Authorization': `Bearer ${token}` } };
          
          try {
            const resCheck = await api.get(`/adquisiciones/check/${id}`, config);
            setLoTengo(resCheck.data.comprado);
          } catch (e) { console.error(e); }

          try {
            const resDeseado = await api.get(`/deseados/check/${id}`, config);
            setEsDeseado(resDeseado.data.esDeseado);
          } catch (e) { console.error(e); }

          try {
             const resHistorial = await api.get('/adquisiciones/mis-libros', config);
             setEsPrimeraCompra(resHistorial.data.length === 0);
          } catch (e) { console.log("Usuario nuevo o error historial"); }
        }
      } catch (err) {
        setError('Error al cargar datos del libro.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, isAuthenticated, token]);

  // --- HANDLERS ---
  const handleAbrirCompra = () => {
    if (!isAuthenticated) {
        toast({ title: 'Debes iniciar sesión para comprar.', status: 'warning' });
        return;
    }
    setAceptaTerminos(false);
    setMostrarModalPago(true);
  };

  const handleConfirmarPago = async () => {
    setProcesandoPago(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
      await api.post('/adquisiciones/comprar', 
        { items: [{ id: Number(id), precio: precioLibro }] }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setMostrarModalPago(false);
      setLoTengo(true);
      
      toast({ title: '¡Compra Exitosa!', description: `Libro añadido a tu biblioteca.`, status: 'success', duration: 5000, isClosable: true });
    } catch (error: any) {
      toast({ title: 'Error en la compra', description: error.response?.data?.error || 'No se pudo procesar el pago.', status: 'error' });
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleToggleDeseado = async () => {
    if (!isAuthenticated) return;
    setLoadingDeseado(true);
    try {
      if (esDeseado) {
          await api.delete(`/deseados/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          setEsDeseado(false);
          toast({ title: "Eliminado de deseados", status: "info", duration: 1000 });
      } else {
          await api.post('/deseados', { id_libro: id }, { headers: { 'Authorization': `Bearer ${token}` } });
          setEsDeseado(true);
          toast({ title: "Agregado a deseados", status: "success", duration: 1000 });
      }
    } catch (error) {
      toast({ title: 'Error al actualizar deseados', status: 'error' });
    } finally {
      setLoadingDeseado(false);
    }
  };

  const handleEnviarResena = async () => {
    if (nuevaCalificacion === 0) {
        toast({ title: 'Selecciona una calificación', status: 'warning' });
        return;
    }
    setEnviandoResena(true);
    try {
        await api.post('/resenas', 
            { id_libro: id, calificacion: nuevaCalificacion, comentario: nuevoComentario }, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast({ title: 'Reseña publicada', status: 'success' });
        setNuevoComentario('');
        setNuevaCalificacion(0);
        const res = await api.get(`/resenas/${id}`);
        setresenas(res.data);
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
      
      {/* --- SECCIÓN PRINCIPAL: PORTADA E INFO --- */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={16}>
        {/* Portada Principal: Usamos AspectRatio para forzar formato libro vertical */}
        <Box w="100%" display="flex" justifyContent="center">
             <Box w="100%" maxW="400px" borderRadius="md" shadow="2xl" overflow="hidden">
                <AspectRatio ratio={2 / 3}>
                    {libro.portada_url ? (
                        <Image 
                            src={libro.portada_url.startsWith('http') ? libro.portada_url : `https://biblioteca-digital-fi5y.onrender.com/${libro.portada_url}`}
                            objectFit="cover" 
                            fallbackSrc="https://via.placeholder.com/400x600?text=Sin+Portada"
                        />
                    ) : (
                        <Box bg="gray.100" display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FaBook} boxSize="80px" color="gray.400" />
                        </Box>
                    )}
                </AspectRatio>
            </Box>
        </Box>

        <Stack spacing={4}>
          <Heading as="h1" size="xl">{libro.titulo}</Heading>
          <Text fontSize="2xl" color={colorTexto}>por {libro.autor}</Text>
          <Tag size="lg" colorScheme="teal" w="fit-content">{libro.categoria || 'Sin Categoría'}</Tag>
          <Text fontSize="lg" mt={4} color={colorTexto}>{libro.descripcion}</Text>
          
          <HStack spacing={4} mt={6}>
              {loTengo ? (
                  <Button flex="1" colorScheme="green" size="lg" isDisabled>
                      ¡Ya es tuyo!
                  </Button>
              ) : (
                  <Button flex="1" colorScheme="blue" size="lg" onClick={handleAbrirCompra}>
                    Comprar ahora
                  </Button>
              )}

              {isAuthenticated && !loTengo && (
                <Tooltip label={esDeseado ? "Quitar de deseados" : "Agregar a deseados"}>
                  <IconButton
                    aria-label="deseados" 
                    icon={esDeseado ? <Icon as={FaHeart} color="red.500" /> : <Icon as={FaRegHeart} />}
                    size="lg" 
                    variant="outline" 
                    colorScheme="red"
                    onClick={handleToggleDeseado} 
                    isLoading={loadingDeseado}
                  />
                </Tooltip>
              )}
          </HStack>
        </Stack>
      </SimpleGrid>

      <Divider mb={10} borderColor={borderColor} />

      {/* --- SECCIÓN NUEVA: libros RELACIONADOS (USANDO TU LIBROCARD) --- */}
      {relacionados.length > 0 && (
        <Box mb={16}>
            <Heading size="lg" mb={6}>También te podría interesar</Heading>
            
            {/* Usamos el mismo layout que en el Catálogo */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {relacionados.map((rel) => (
                    <LibroCard key={rel.id} libro={rel} />
                ))}
            </SimpleGrid>
            
            <Divider mt={10} borderColor={borderColor} />
        </Box>
      )}

      {/* --- SECCIÓN: RESEÑAS --- */}
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
                    bg={bgInput} 
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
                      key={resena.id} p={5} borderWidth="1px" borderRadius="md" 
                      bg={bgComentario} borderColor={borderColor} boxShadow="sm"
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
                        <Text mt={3} color={colorTexto}>{resena.comentario}</Text>
                    </Box>
                ))}
            </VStack>
        )}
      </Box>

      {/* --- MODAL DE PAGO PROFESIONAL --- */}
      <Modal 
        isOpen={mostrarModalPago} 
        onClose={() => setMostrarModalPago(false)} 
        isCentered 
        size="lg" 
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
        
        <ModalContent borderRadius="xl" overflow="hidden" bg={bgModal}>
   
          <ModalHeader bg={bgCaja} borderBottomWidth="1px" borderColor={borderColor} py={4}>
            <HStack justify="space-between">
                <HStack>
                    <Icon as={FaLock} color="green.500" />
                    <Text fontSize="lg" fontWeight="bold">Finalizar Compra Segura</Text>
                </HStack>
                <Tag colorScheme="green" variant="subtle">
                    <Icon as={FaShieldAlt} mr={1}/> SSL Encrypted
                </Tag>
            </HStack>
          </ModalHeader>
          
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              
              {/* 1. RESUMEN: Usamos tu 'bgCaja' y 'borderColor' */}
              <HStack spacing={4} align="start" bg={bgCaja} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                 <Image 
                    src={libro?.portada_url ? (libro.portada_url.startsWith('http') ? libro.portada_url : `https://biblioteca-digital-fi5y.onrender.com/${libro.portada_url}`) : 'https://via.placeholder.com/50'}
                    boxSize="60px"
                    objectFit="cover"
                    borderRadius="md"
                    alt="Portada"
                 />
                 <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" noOfLines={1}>{libro?.titulo}</Text>
                    {/* Usamos tu 'colorTexto' */}
                    <Text fontSize="sm" color={colorTexto}>{libro?.autor}</Text>
                    <Tag size="sm" colorScheme="blue" mt={1} variant="solid">Digital / E-book</Tag>
                 </VStack>
              </HStack>

              {/* 2. MÉTODO DE PAGO */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2} color={colorTexto}>Método de Pago</Text>
                <RadioGroup defaultValue="card">
                    <Stack spacing={3}>
                        <Box 
                            borderWidth="1px" 
                            borderRadius="md" 
                            p={3} 
                            borderColor={borderColor} // Tu variable
                            _hover={{ borderColor: 'blue.500', bg: useColorModeValue('blue.50', 'whiteAlpha.100') }} 
                            cursor="pointer"
                        >
                            <Radio value="card" colorScheme="blue">
                                <HStack spacing={3}>
                                    <Icon as={FaCreditCard} color="blue.500" boxSize={5} />
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">Tarjeta Visa terminada en 4242</Text>
                                        <Text fontSize="xs" color={colorTexto}>Expira 12/28 • J. Pérez</Text>
                                    </VStack>
                                </HStack>
                            </Radio>
                        </Box>
                    </Stack>
                </RadioGroup>
              </Box>

              {/* 3. DESGLOSE */}
              <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2} color={colorTexto}>Detalle de Facturación</Text>
                  <VStack spacing={2} align="stretch" fontSize="sm">
                    <HStack justify="space-between">
                        <Text color={colorTexto}>Precio de lista</Text>
                        <Text textDecoration={esPrimeraCompra ? "line-through" : "none"}>
                           ${precioLibro.toFixed(2)}
                        </Text>
                    </HStack>

                    {esPrimeraCompra && (
                        <HStack justify="space-between" color="green.500">
                            <Text>Descuento Bienvenida (50%)</Text>
                            <Text fontWeight="bold">-${(precioLibro * 0.5).toFixed(2)}</Text>
                        </HStack>
                    )}
                    
                    <Divider my={2} borderColor={borderColor} />
                    
                    {/* CAJA TOTAL: Usamos las nuevas variables 'bgTotal' y 'colorTotal' */}
                    <HStack justify="space-between" bg={bgTotal} p={3} borderRadius="md" borderWidth="1px" borderColor={useColorModeValue('blue.100', 'blue.700')}>
                        <Text fontWeight="bold" fontSize="lg" color={colorTotal}>Total a Pagar</Text>
                        <Text fontWeight="bold" fontSize="2xl" color={colorTotal}>
                        ${esPrimeraCompra ? (precioLibro * 0.5).toFixed(2) : precioLibro.toFixed(2)}
                        </Text>
                    </HStack>
                  </VStack>
              </Box>

              {/* 4. TÉRMINOS: Usamos la nueva variable 'bgTerminos' */}
              <Box bg={bgTerminos} p={3} borderRadius="md" borderWidth="1px" borderColor={useColorModeValue('orange.200', 'orange.800')}>
                  <Checkbox 
                    isChecked={aceptaTerminos} 
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    colorScheme="orange"
                    alignItems="flex-start"
                  >
                    <Text fontSize="xs" mt={-1}>
                        Declaro que acepto los <Text as="span" fontWeight="bold" cursor="pointer" textDecoration="underline">Términos de Servicio</Text> y entiendo que no hay devoluciones.
                    </Text>
                  </Checkbox>
              </Box>

            </VStack>
          </ModalBody>

          {/* Footer: Usamos tu 'bgCaja' */}
          <ModalFooter bg={bgCaja} borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" mr={3} onClick={() => setMostrarModalPago(false)}>
                Cancelar
            </Button>
            <Button 
                colorScheme="green" 
                size="lg"
                onClick={handleConfirmarPago} 
                isLoading={procesandoPago} 
                loadingText="Procesando..."
                isDisabled={!aceptaTerminos} 
                shadow="md"
                px={8}
                leftIcon={<Icon as={FaLock} />}
            >
              Pagar Ahora
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}

export default LibroDetalle;