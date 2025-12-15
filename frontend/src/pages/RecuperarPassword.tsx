import { Box, Button, FormControl, FormLabel, Input, Heading, Text, useToast, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulación de llamada al backend
    // Aquí iría: await api.post('/usuarios/recuperar', { email });
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Correo enviado',
        description: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setEmail('');
    }, 2000);
  };

  return (
    <Box maxW='md' mx='auto' mt={10} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading size="lg" textAlign='center' mb={4}>Recuperar Contraseña</Heading>
      <Text mb={6} color="gray.600" textAlign="center">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu acceso.
      </Text>
      
      <Box as='form' onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </FormControl>

          <Button type='submit' colorScheme='blue' width='full' isLoading={isLoading}>
            Enviar Enlace
          </Button>

          <Button as={RouterLink} to="/login" variant="ghost" width="full">
            Volver al Login
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

export default RecuperarPassword;