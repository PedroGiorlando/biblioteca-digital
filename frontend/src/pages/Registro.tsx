import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  useToast,
  Text,
  FormErrorMessage, // Para mostrar errores rojos debajo del input
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 1. Nuevo estado
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para errores de validación locales
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

  const toast = useToast();
  const navigate = useNavigate();

  // 2. Función para validar la fortaleza de la contraseña
  const validarPassword = (pass: string) => {
    // Regex: Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regex.test(pass)) {
      return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 3. Validaciones antes de llamar a la API
    const errorPass = validarPassword(password);
    if (errorPass) {
      setErrors({ ...errors, password: errorPass });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Las contraseñas no coinciden.' });
      return;
    }

    // Limpiamos errores previos
    setErrors({ password: '', confirmPassword: '' });
    setIsLoading(true);

    try {
      await api.post('/usuarios/registro', {
        nombre,
        email,
        password,
      });

      toast({
        title: '¡Registro exitoso!',
        description: 'Ahora puedes iniciar sesión.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');

    } catch (error: any) {
      console.error('Error en el registro:', error);
      
      // 4. Manejo específico si el email ya existe (viene del backend)
      const mensajeError = error.response?.data?.error || 'Ocurrió un error inesperado.';
      
      toast({
        title: 'Error en el registro',
        description: mensajeError, // "El email ya está registrado"
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW='md' mx='auto' mt={10} p={6}>
      <Heading textAlign='center' mb={6}>Crear Cuenta</Heading>
      <Box as='form' onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nombre Completo</FormLabel>
            <Input
              type='text'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </FormControl>

          {/* Input de Contraseña con Validación */}
          <FormControl isRequired isInvalid={!!errors.password}>
            <FormLabel>Contraseña</FormLabel>
            <Input
              type='password'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' }); // Limpiar error al escribir
              }}
            />
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>

          {/* Input de Repetir Contraseña */}
          <FormControl isRequired isInvalid={!!errors.confirmPassword}>
            <FormLabel>Repetir Contraseña</FormLabel>
            <Input
              type='password'
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
              }}
            />
            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
          </FormControl>

          <Button type='submit' colorScheme='blue' width='full' isLoading={isLoading}>
            Registrarse
          </Button>

          <Text fontSize="sm">
            ¿Ya tienes cuenta? <Text as={RouterLink} to="/login" color="blue.500">Inicia sesión</Text>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}

export default Registro;