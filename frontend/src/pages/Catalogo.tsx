import {
  Box, Heading, SimpleGrid, Input, FormControl, InputGroup, InputLeftElement,
  Text,
  Select,
  HStack,
  FormLabel,
  Button
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import api from '../services/api';
import LibroCard from '../components/LibroCard';

// ... (la 'interface Libro' es la misma) ...
interface Libro {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  categoria: string | null;
}


function Catalogo() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // useEffect para cargar las categorías (sigue igual)
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

 // useEffect para cargar LIBROS (¡ACTUALIZADO!)
  useEffect(() => {
    const fetchLibros = async () => {
      setLoading(true); // Activar spinner
      try {
        const params = new URLSearchParams();
        if (busqueda) params.append('q', busqueda);
        if (categoriaSeleccionada) params.append('categoria', categoriaSeleccionada);
        params.append('page', currentPage.toString()); // 4. Añadir la página a la petición

        const response = await api.get(`/libros?${params.toString()}`);

        // 5. Guardar los libros Y los datos de paginación
        setLibros(response.data.libros);
        setTotalPages(response.data.totalPages);

      } catch (error) {
        console.error('Error al cargar libros:', error);
      } finally {
        setLoading(false); // Desactivar spinner
      }
    };

    fetchLibros();
  }, [busqueda, categoriaSeleccionada, currentPage]);

  // --- ¡AQUÍ ESTÁ LA NUEVA LÓGICA! ---

  // Función para el BUSCADOR
 const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCategoriaSeleccionada('');
    setCurrentPage(1); // Resetea a la página 1 al buscar
  };

  // Función para el DROPDOWN
  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSeleccionada(e.target.value);
    setBusqueda('');
    setCurrentPage(1); // Resetea a la página 1 al filtrar
  };
  const handlePaginaSiguiente = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePaginaAnterior = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  return (
    <Box>
      <Heading mb={6}>Nuestro Catálogo</Heading>

      {/* Los inputs ahora usan los nuevos handlers */}
      <HStack spacing={4} mb={8}>
        {/* Buscador de Texto */}
        <FormControl id="search">
          <FormLabel>Buscar por Título o Autor</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Ej: Dune, Tolkien..."
              value={busqueda}
              onChange={handleBusquedaChange} // <-- Handler actualizado
            />
          </InputGroup>
        </FormControl>

        {/* Dropdown de Categoría */}
        <FormControl id="category">
          <FormLabel>Explorar por Categoría</FormLabel>
          <Select
            placeholder="Todas las categorías"
            value={categoriaSeleccionada}
            onChange={handleCategoriaChange} // <-- Handler actualizado
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </FormControl>
      </HStack>

      {/* Grilla de Libros (sigue igual) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={10}>
        {libros.map((libro) => (
          <LibroCard key={libro.id} libro={libro} />
        ))}
      </SimpleGrid>

      {/* Mensaje si no hay libros (sigue igual) */}
      {libros.length === 0 && (
        <Text textAlign="center" mt={10} fontSize="lg">
          No se encontraron libros que coincidan con tu búsqueda.
        </Text>
      )}
      {totalPages > 1 && (
            <HStack justifyContent="center" mt={10} spacing={4}>
              <Button
                onClick={handlePaginaAnterior}
                isDisabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Text>
                Página {currentPage} de {totalPages}
              </Text>
              <Button
                onClick={handlePaginaSiguiente}
                isDisabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </HStack>
          )}
    </Box>
  );
}

export default Catalogo;