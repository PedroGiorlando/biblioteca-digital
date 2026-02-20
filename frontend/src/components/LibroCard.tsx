import { Box, Image, Heading, Text, Button, Badge, Icon, Flex, VStack, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaBook } from 'react-icons/fa';

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  categoria: string | null;
}

interface Props {
  libro: Libro;
}

function LibroCard({ libro }: Props) {

  const bgCard = useColorModeValue('white', 'gray.700'); // Blanco en día, Gris oscuro en noche
  const colorTexto = useColorModeValue('gray.600', 'gray.300'); // Gris oscuro en día, Gris claro en noche
  const bgImagen = useColorModeValue('gray.100', 'gray.600'); // Fondo de la imagen
  
 const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  // 1. Eliminamos la barra inicial si existe para evitar rutas con '//'
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

  // 2. Nos aseguramos de que incluya la ruta estática que definiste en tu backend
  const finalPath = cleanUrl.startsWith('uploads/') ? cleanUrl : `uploads/${cleanUrl}`;

  return `https://biblioteca-digital-fi5y.onrender.com/${finalPath}`;
};

  return (
    <Flex
      // 1. Volvemos al diseño Horizontal (Row)
      direction={{ base: 'column', sm: 'row' }}
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      bg={bgCard}
      // Bordes decorativos
      borderLeftWidth={{ sm: '4px' }}
      borderTopWidth={{ base: '4px', sm: '0' }}
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      transition="all 0.2s ease-in-out"
      _hover={{
        boxShadow: 'xl',
        transform: 'translateY(-2px)',
        borderColor: 'brand.500'
      }}
      // Altura fija para que se vea "alargado" y uniforme
      h={{ sm: "250px" }} 
    >

      {/* --- IZQUIERDA: IMAGEN (Clickable) --- */}
      <Box
        as={RouterLink}           // Hacemos que la caja de la imagen sea un link
        to={`/libro/${libro.id}`} // Lleva al detalle
        cursor="pointer"          // Cursor de manito
        w={{ base: '100%', sm: '180px' }} // Ancho fijo para la portada
        h="100%"
        bg={bgImagen}
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ opacity: 0.9 }} // Pequeño efecto visual al pasar el mouse
      >
        {libro.portada_url ? (
          <Image
            src={getImageUrl(libro.portada_url)}
            alt={`Portada de ${libro.titulo}`}
            objectFit="cover" // "Cover" llena todo el espacio sin bordes blancos
            w="100%"
            h="100%"
          />
        ) : (
          <Icon as={FaBook} boxSize="50px" color="gray.400" />
        )}
      </Box>
      
      {/* --- DERECHA: INFORMACIÓN --- */}
      <VStack 
        p={5} 
        align="start" 
        justify="space-between" 
        flex="1" 
        spacing={2}
        w="100%"
      >
        <Box w="100%">
          {libro.categoria && (
            <Badge borderRadius="full" px="2" colorScheme="teal" mb={2} fontSize="xs">
              {libro.categoria}
            </Badge>
          )}

          {/* Título */}
          <Heading size="md" noOfLines={2} lineHeight="short" mb={1}>
            {libro.titulo}
          </Heading>

          {/* Autor */}
          <Text color={colorTexto} fontSize="sm" noOfLines={1}>
            {libro.autor}
          </Text>
        </Box>

        {/* Botón de acción */}
        <Button
          as={RouterLink}
          to={`/libro/${libro.id}`}
          colorScheme="blue"
          variant="outline"
          size="sm"
          width="full"
          mt="auto"
        >
          Ver Detalles
        </Button>
      </VStack>
    </Flex>
  );
}

export default LibroCard;