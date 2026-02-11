import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Box, Container, Text, Heading, Button, HStack, VStack,
  Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  IconButton, useToast, Menu, MenuButton, MenuList, MenuItem,
  Progress, Flex, Spinner
} from '@chakra-ui/react';
import { ArrowBackIcon, ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from '@chakra-ui/icons';
import { FaFont } from 'react-icons/fa';

// --- TEXTO SIMULADO ---
// Generamos párrafos largos para simular el contenido de un libro
const generarTextoSimulado = (titulo: string, capitulo: number) => {
    return `
    CAPÍTULO ${capitulo}: El inicio de ${titulo}
    
    Había una vez, en un lugar muy lejano, una historia llamada "${titulo}" que cautivó a todos. 
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    
    Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. 
    Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. 
    
    "${titulo}" no era un libro cualquiera. Era el libro que cambiaría el destino de quien lo leyera.
    Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. 
    Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi.
    
    (Fin de la página ${capitulo})
    `;
};

function Lector() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [libro, setLibro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Configuración de Lectura
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas] = useState(20); 
  const [tamanoFuente, setTamanoFuente] = useState(18);
  const [tema, setTema] = useState<'claro' | 'oscuro' | 'sepia'>('claro');

  // Cargar info del libro (solo título y autor)
  useEffect(() => {
    const cargarLibro = async () => {
        try {
            const res = await api.get(`/libros/${id}`);
            setLibro(res.data);
        } catch (error) {
            console.error("Error cargando libro", error);
        } finally {
            setLoading(false);
        }
    };
    cargarLibro();
  }, [id]);

  // Colores según el tema elegido
  const estilosTema = {
    claro: { bg: 'white', color: 'gray.800' },
    oscuro: { bg: 'gray.800', color: 'gray.200' },
    sepia: { bg: '#f4ecd8', color: '#5b4636' }
  };

  const handlePaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
        setPaginaActual(p => p + 1);
        window.scrollTo(0, 0); // Subir al inicio al cambiar de página
    }
  };

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
        setPaginaActual(p => p - 1);
        window.scrollTo(0, 0);
    }
  };

  if (loading) return <Flex justify="center" align="center" h="100vh"><Spinner size="xl" /></Flex>;
  if (!libro) return <Container><Text>Libro no encontrado</Text></Container>;

  return (
    <Box 
        minH="100vh" 
        bg={estilosTema[tema].bg} 
        color={estilosTema[tema].color} 
        transition="all 0.3s"
        position="absolute" 
        top="0" left="0" right="0"
        zIndex={100} 
    >
      {/* --- BARRA SUPERIOR (NAVBAR DEL LECTOR) --- */}
      <Flex 
        p={4} 
        justify="space-between" 
        align="center" 
        borderBottomWidth="1px" 
        borderColor={tema === 'oscuro' ? 'gray.700' : 'gray.200'}
        position="sticky" top="0" bg={estilosTema[tema].bg} zIndex={10}
      >
        <HStack>
            <IconButton 
                aria-label="Volver" 
                icon={<ArrowBackIcon />} 
                variant="ghost" 
                onClick={() => navigate('/mi-biblioteca')}
                color={estilosTema[tema].color}
            />
            <Text fontWeight="bold" noOfLines={1} maxW="200px">
                {libro.titulo}
            </Text>
        </HStack>

        {/* MENÚ DE CONFIGURACIÓN */}
        <Menu closeOnSelect={false}>
            <MenuButton as={IconButton} icon={<SettingsIcon />} variant="ghost" color={estilosTema[tema].color} />
            <MenuList bg={estilosTema[tema].bg} borderColor="gray.300">
                <Box p={4} minW="250px">
                    <Text mb={2} fontWeight="bold" fontSize="sm">Tamaño de letra</Text>
                    <Slider 
                        aria-label="font-size" 
                        defaultValue={18} 
                        min={14} max={30} 
                        onChange={(v) => setTamanoFuente(v)}
                    >
                        <SliderTrack><SliderFilledTrack /></SliderTrack>
                        <SliderThumb />
                    </Slider>

                    <Text mt={4} mb={2} fontWeight="bold" fontSize="sm">Tema</Text>
                    <HStack spacing={2}>
                        <Button size="sm" bg="white" color="black" border="1px solid gray" onClick={() => setTema('claro')}>A</Button>
                        <Button size="sm" bg="#f4ecd8" color="#5b4636" onClick={() => setTema('sepia')}>A</Button>
                        <Button size="sm" bg="gray.800" color="white" onClick={() => setTema('oscuro')}>A</Button>
                    </HStack>
                </Box>
            </MenuList>
        </Menu>
      </Flex>

      {/* --- CONTENIDO DEL LIBRO --- */}
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} align="start">
            {/* Título del Capítulo */}
            <Heading size="md" fontFamily="serif" opacity={0.7}>
                Capítulo {paginaActual}
            </Heading>
            
            {/* Texto Generado */}
            <Text 
                fontSize={`${tamanoFuente}px`} 
                lineHeight="1.8" 
                fontFamily="'Merriweather', 'Georgia', serif" // Fuente tipo libro
                whiteSpace="pre-line" // Respeta los saltos de línea
                textAlign="justify"
            >
                {generarTextoSimulado(libro.titulo, paginaActual)}
            </Text>
        </VStack>
      </Container>

      {/* --- BARRA INFERIOR (PAGINACIÓN) --- */}
      <Box 
        position="fixed" bottom="0" left="0" right="0" 
        p={4} bg={estilosTema[tema].bg} 
        borderTopWidth="1px" borderColor={tema === 'oscuro' ? 'gray.700' : 'gray.200'}
      >
        <Container maxW="container.md">
            <VStack spacing={2}>
                <Progress 
                    value={(paginaActual / totalPaginas) * 100} 
                    size="xs" width="100%" colorScheme="blue" 
                />
                <Flex justify="space-between" width="100%" align="center">
                    <Button 
                        leftIcon={<ChevronLeftIcon />} 
                        onClick={handlePaginaAnterior} 
                        isDisabled={paginaActual === 1}
                        variant="ghost"
                        color={estilosTema[tema].color}
                    >
                        Anterior
                    </Button>

                    <Text fontSize="sm">
                        Página {paginaActual} de {totalPaginas}
                    </Text>

                    <Button 
                        rightIcon={<ChevronRightIcon />} 
                        onClick={handlePaginaSiguiente} 
                        isDisabled={paginaActual === totalPaginas}
                        variant="ghost"
                        color={estilosTema[tema].color}
                    >
                        Siguiente
                    </Button>
                </Flex>
            </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default Lector;