import { useState, useRef, useEffect } from 'react';
import {
  Box, Heading, FormControl, FormLabel, Input, Button, VStack, HStack,
  Avatar, useToast, Tabs, TabList, TabPanels, Tab, TabPanel, Divider,
  Container, Text, useColorModeValue
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function MiPerfil() {
  const { user, token, login } = useAuth(); 
  const toast = useToast();

  // --- COLORES DINÁMICOS (DARK MODE) ---
  const bgCard = useColorModeValue('white', 'gray.800');
  const colorTexto = useColorModeValue('gray.800', 'white');
  const colorTextoSecundario = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgInput = useColorModeValue('white', 'gray.700');
  const bgInputReadOnly = useColorModeValue('gray.50', 'gray.600');

  // --- ESTADOS PERFIL ---
  const [nombre, setNombre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // Para mostrar la foto antes de subirla
  const [loadingProfile, setLoadingProfile] = useState(false);

  // --- ESTADOS PASSWORD ---
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado local con contexto
  useEffect(() => {
    if (user) {
        setNombre(user.nombre || '');
    }
  }, [user]);

  // Helper para construir la URL de la imagen
  const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `https://biblioteca-digital-fi5y.onrender.com/${path}`; // <-- Cambiado aquí
};

  // --- MANEJO DE FOTO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile)); // Previsualización local
    }
  };

  // --- ACTUALIZAR DATOS (NOMBRE Y FOTO) ---
const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (file) {
        formData.append('foto', file);
      }

      const response = await api.put('/usuarios/perfil', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // El backend devuelve 'usuario', no 'user'.
      if (token && response.data.usuario) {
        
        // Actualizamos el contexto y el localStorage
        login(token, { ...user, ...response.data.usuario }); 
      }

      toast({ title: 'Perfil actualizado', status: 'success', duration: 3000, isClosable: true });

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error al actualizar', description: error.response?.data?.error, status: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- CAMBIAR CONTRASEÑA ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passNueva !== passConfirm) {
      toast({ title: 'Las contraseñas no coinciden', status: 'error' });
      return;
    }
    setLoadingPass(true);

    try {
      await api.put('/usuarios/password', {
        passwordActual: passActual,
        passwordNueva: passNueva
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast({ title: 'Contraseña actualizada', status: 'success', duration: 3000, isClosable: true });
      setPassActual('');
      setPassNueva('');
      setPassConfirm('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error, status: 'error' });
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <Box 
        bg={bgCard} 
        color={colorTexto}
        borderWidth="1px" 
        borderColor={borderColor}
        borderRadius="xl" 
        boxShadow="lg" 
        p={6}
      >
        <Heading mb={6} size="lg">Mi Perfil</Heading>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList borderColor={borderColor}>
            <Tab _selected={{ color: 'blue.500', bg: bgCard, borderColor: borderColor, borderBottomColor: 'transparent', fontWeight: 'bold' }}>
                Datos Personales
            </Tab>
            <Tab _selected={{ color: 'blue.500', bg: bgCard, borderColor: borderColor, borderBottomColor: 'transparent', fontWeight: 'bold' }}>
                Seguridad
            </Tab>
          </TabList>

          <TabPanels>
            {/* --- PANEL 1: DATOS Y FOTO --- */}
            <TabPanel px={0} py={6}>
              <form onSubmit={handleUpdateProfile}>
                <VStack spacing={6} align="start">
                  
                  {/* Sección de Avatar */}
                  <HStack spacing={6} align="center" w="full">
                    <Avatar 
                      size="2xl" 
                      name={user?.nombre} 
                      src={preview || getAvatarUrl(user?.foto_url as string)} 
                      borderWidth="2px"
                      borderColor="blue.500"
                    />
                    <VStack align="start" spacing={2}>
                      <Heading size="sm">Foto de Perfil</Heading>
                      <Text fontSize="sm" color={colorTextoSecundario}>Permitido: JPG, PNG. Máx 5MB.</Text>
                      
                      <HStack>
                          <Button size="sm" onClick={() => fileInputRef.current?.click()} colorScheme="blue" variant="outline">
                            Subir nueva foto
                          </Button>
                          <Input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*"
                          />
                      </HStack>
                    </VStack>
                  </HStack>

                  <Divider borderColor={borderColor} />

                  {/* Inputs de Texto */}
                  <VStack spacing={4} w="full">
                    <FormControl>
                        <FormLabel color={colorTextoSecundario}>Correo Electrónico</FormLabel>
                        <Input 
                            value={user?.email} 
                            isReadOnly 
                            bg={bgInputReadOnly} 
                            borderColor={borderColor} 
                            color={colorTextoSecundario}
                            _hover={{}}
                            cursor="not-allowed"
                        />
                        <Text fontSize="xs" mt={1} color={colorTextoSecundario}>El email no se puede modificar.</Text>
                    </FormControl>

                    <FormControl>
                        <FormLabel color={colorTextoSecundario}>Nombre Completo</FormLabel>
                        <Input 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            bg={bgInput}
                            borderColor={borderColor}
                        />
                    </FormControl>
                  </VStack>

                  <Button type="submit" colorScheme="blue" isLoading={loadingProfile} mt={2}>
                    Guardar Cambios
                  </Button>
                </VStack>
              </form>
            </TabPanel>

            {/* --- PANEL 2: CONTRASEÑA --- */}
            <TabPanel px={0} py={6}>
              <form onSubmit={handleChangePassword}>
                <VStack spacing={5} align="start" maxW="md">
                  <Text color={colorTextoSecundario} mb={2}>
                      Asegúrate de usar una contraseña segura que no utilices en otros sitios.
                  </Text>
                  
                  <FormControl isRequired>
                    <FormLabel color={colorTextoSecundario}>Contraseña Actual</FormLabel>
                    <Input 
                        type="password" 
                        value={passActual} 
                        onChange={(e) => setPassActual(e.target.value)} 
                        bg={bgInput} 
                        borderColor={borderColor}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel color={colorTextoSecundario}>Nueva Contraseña</FormLabel>
                    <Input 
                        type="password" 
                        value={passNueva} 
                        onChange={(e) => setPassNueva(e.target.value)} 
                        bg={bgInput} 
                        borderColor={borderColor}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel color={colorTextoSecundario}>Repetir Nueva Contraseña</FormLabel>
                    <Input 
                        type="password" 
                        value={passConfirm} 
                        onChange={(e) => setPassConfirm(e.target.value)} 
                        bg={bgInput} 
                        borderColor={borderColor}
                    />
                  </FormControl>
                  
                  <Button type="submit" colorScheme="red" mt={4} isLoading={loadingPass}>
                    Actualizar Contraseña
                  </Button>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default MiPerfil;