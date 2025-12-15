import { Box, Heading, SimpleGrid, Text, Spinner } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LibroCard from '../components/LibroCard';

// Reusamos la interfaz de Libro
interface Libro {
  id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  categoria: string | null;
}

function ListaDeseados() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDeseados = async () => {
      try {
        const response = await api.get('/deseados', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setLibros(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDeseados();
  }, [token]);

  if (loading) return <Box textAlign="center" mt={20}><Spinner size="xl" /></Box>;

  return (
    <Box>
      <Heading mb={6}>Mi Lista de Deseados ❤️</Heading>
      
      {libros.length === 0 ? (
        <Text fontSize="lg" color="gray.500">No tienes libros en tu lista de deseados aún.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6}>
          {libros.map((libro) => (
            <LibroCard key={libro.id} libro={libro} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default ListaDeseados;