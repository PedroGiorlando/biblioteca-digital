import {
  Box, Heading, SimpleGrid, Input, FormControl, InputGroup, InputLeftElement,
  Text, Select, HStack, FormLabel, Button, Badge
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import api from '../services/api';
import LibroCard from '../components/LibroCard';
import { useAuth } from '../context/AuthContext';

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  categoria: string | null;
}

function Catalogo() {
  // Estados de datos
  const [libros, setLibros] = useState<Libro[]>([]);
  const [misLibrosIds, setMisLibrosIds] = useState<number[]>([]); // Lista de IDs que ya compré
  const [categorias, setCategorias] = useState<string[]>([]);
  
  // Estados de UI y Filtros
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { isAuthenticated, token } = useAuth();

  // 1. Cargar Categorías (Solo una vez)
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await api.get('/categorias');
        setCategorias(response.data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    fetchCategorias();
  }, []);

  // 2. Cargar "Mis Libros" (Solo si estoy logueado)
  useEffect(() => {
    if (isAuthenticated && token) {
        const fetchMisLibros = async () => {
           try {
             const res = await api.get('/adquisiciones/mis-libros', {
                headers: { 'Authorization': `Bearer ${token}` }
             });
             // Guardamos solo los IDs en un array simple: [1, 5, 20]
             const ids = res.data.map((l: any) => l.id);
             setMisLibrosIds(ids);
           } catch (error) {
             console.error("Error cargando mis libros", error);
           }
        };
        fetchMisLibros();
    }
  }, [isAuthenticated, token]);

  // 3. Cargar el Catálogo (Cada vez que busco, filtro o cambio de página)
  useEffect(() => {
    const fetchLibros = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (busqueda) params.append('q', busqueda);
        if (categoriaSeleccionada) params.append('categoria', categoriaSeleccionada);
        params.append('page', currentPage.toString());

        const response = await api.get(`/libros?${params.toString()}`);
        
        // Asumiendo que tu backend devuelve { libros: [], totalPages: 1 }
        // Si tu backend devuelve un array directo, ajusta esto.
        if (response.data.libros) {
            setLibros(response.data.libros);
            setTotalPages(response.data.totalPages);
        } else {
            // Fallback por si el backend devuelve array directo
            setLibros(response.data); 
        }

      } catch (error) {
        console.error('Error al cargar libros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibros();
  }, [busqueda, categoriaSeleccionada, currentPage]);


  // --- HANDLERS ---
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCategoriaSeleccionada('');
    setCurrentPage(1);
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSeleccionada(e.target.value);
    setBusqueda('');
    setCurrentPage(1);
  };

  const handlePaginaSiguiente = () => setCurrentPage((p) => p + 1);
  const handlePaginaAnterior = () => setCurrentPage((p) => p - 1);


  return (
    <Box>
      <Heading mb={6}>Nuestro Catálogo</Heading>
      <HStack spacing={4} mb={8}>
        <FormControl id="search">
          <FormLabel>Buscar por Título o Autor</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Ej: Dune, Tolkien..."
              value={busqueda}
              onChange={handleBusquedaChange}
            />
          </InputGroup>
        </FormControl>

        <FormControl id="category">
          <FormLabel>Explorar por Categoría</FormLabel>
          <Select
            placeholder="Todas las categorías"
            value={categoriaSeleccionada}
            onChange={handleCategoriaChange}
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
        </FormControl>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
        {libros.map((libro) => {
            // Verificamos si este libro está en mi lista de IDs comprados
            const loTengo = misLibrosIds.includes(libro.id);

            return (
                <Box key={libro.id} position="relative"> 
                    {/* ETIQUETA FLOTANTE */}
                    {loTengo && (
                        <Badge 
                          colorScheme="green" 
                          variant="solid" 
                          position="absolute" 
                          top="-10px" 
                          right="-10px" 
                          zIndex={2}
                          fontSize="0.8em"
                          px={3}
                          py={1}
                          borderRadius="full"
                          boxShadow="md"
                        >
                          EN TU BIBLIOTECA
                        </Badge>
                    )}
                    
                    <Box opacity={loTengo ? 0.9 : 1}>
                        <LibroCard libro={libro} />
                    </Box>
                </Box>
            );
        })}
      </SimpleGrid>

      {libros.length === 0 && !loading && (
        <Text textAlign="center" mt={10} fontSize="lg">
          No se encontraron libros.
        </Text>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <HStack justifyContent="center" mt={10} spacing={4}>
          <Button onClick={handlePaginaAnterior} isDisabled={currentPage === 1}>
            Anterior
          </Button>
          <Text>Página {currentPage} de {totalPages}</Text>
          <Button onClick={handlePaginaSiguiente} isDisabled={currentPage === totalPages}>
            Siguiente
          </Button>
        </HStack>
      )}
    </Box>
  );
}

export default Catalogo;