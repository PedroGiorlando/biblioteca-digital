import {
  Box, Button, FormControl, FormLabel, Input, Heading, VStack, useToast, Text
} from '@chakra-ui/react';

import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink} from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  // 2. Traer 'login' Y TAMBIÉN 'isAuthenticated' del contexto
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/usuarios/login', {
        email,
        password,
      });

      const { token, usuario } = response.data;

      // 3. SOLO llamamos a login. NO navegamos aquí.
      login(token, usuario); 

      toast({
        title: '¡Login exitoso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error: any) {
      console.error('Error en el login:', error);
      toast({
        title: 'Error al iniciar sesión.',
        description: error.response?.data?.error || 'Ocurrió un error.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 4. Este Hook "escucha" la variable isAuthenticated
  useEffect(() => {
    // 5. "Cuando isAuthenticated cambie a 'true'..."
    if (isAuthenticated) {
      // 6. "...ENTONCES navega a la página principal."
      navigate('/catalogo');
    }
  }, [isAuthenticated, navigate]); // 7. Dependencias: se ejecuta si 'isAuthenticated' cambia

  return (
    <Box maxW='md' mx='auto' mt={10}>
      <Heading textAlign='center' mb={6}>Iniciar Sesión</Heading>
      <Box as='form' onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Contraseña</FormLabel>
            <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormControl>
          <Box w="full" textAlign="right">
            <Text as={RouterLink} to="/recuperar" color="blue.500" fontSize="sm">
              ¿Olvidaste tu contraseña?
            </Text>
          </Box>
          <Button type='submit' colorScheme='blue' width='full'>Entrar</Button>
          <Box mt={6} p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
          <Text fontSize="sm" color="blue.800" fontWeight="bold" mb={1}>
            ¿Evaluando el proyecto?
          </Text>
          <Text fontSize="sm" color="blue.700">
             Prueba la vista de administrador:
          </Text>
          <Text fontSize="sm" color="blue.700">
           <strong>Correo:</strong> pedro@correo.com
          </Text>
          <Text fontSize="sm" color="blue.700">
          <strong>Clave:</strong> miContraseña1!
          </Text>
</Box>
        </VStack>
      </Box>
    </Box>
  );
}

export default Login;