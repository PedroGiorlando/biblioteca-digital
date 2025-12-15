import { useState, useRef } from 'react';
import {
  Box, Heading, FormControl, FormLabel, Input, Button, VStack, HStack,
  Avatar, useToast, Tabs, TabList, TabPanels, Tab, TabPanel, Divider
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function MiPerfil() {
  const { user, token, login } = useAuth(); // Usamos 'login' para actualizar los datos locales
  const toast = useToast();

  // --- ESTADOS PERFIL ---
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // Para mostrar la foto antes de subirla
  const [loadingProfile, setLoadingProfile] = useState(false);

  // --- ESTADOS PASSWORD ---
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper para construir la URL de la imagen
  const getAvatarUrl = (path: string | null | undefined) => {
    if (!path) return undefined; // Deja que Chakra muestre el default
    // Si la ruta ya tiene http (es externa), úsala. Si no, añade el localhost
    return path.startsWith('http') ? path : `http://localhost:3000/${path}`;
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
      // Usamos FormData para enviar archivos
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (file) {
        formData.append('foto', file);
      }

      const response = await api.put('/usuarios/perfil', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', // Importante para archivos
        },
      });

      // Actualizamos el contexto y localStorage con los nuevos datos
      if (token && response.data.usuario) {
        // Mantenemos el mismo token, pero actualizamos el objeto usuario
        // Nota: necesitamos castear el usuario porque la respuesta puede variar
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
    <Box maxW="container.md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="sm" bg="white">
      <Heading mb={6}>Mi Perfil</Heading>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Datos Personales</Tab>
          <Tab>Seguridad</Tab>
        </TabList>

        <TabPanels>
          {/* --- PANEL 1: DATOS Y FOTO --- */}
          <TabPanel>
            <form onSubmit={handleUpdateProfile}>
              <VStack spacing={6} align="start">
                
                {/* Sección de Avatar */}
                <HStack spacing={6}>
                  <Avatar 
                    size="2xl" 
                    name={user?.nombre} 
                    src={preview || getAvatarUrl(user?.foto_url as string)} 
                  />
                  <VStack align="start">
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                      Cambiar Foto
                    </Button>
                    <Input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*"
                    />
                    <Box fontSize="sm" color="gray.500">
                      Permitido: JPG, PNG. Máx 5MB.
                    </Box>
                  </VStack>
                </HStack>

                <Divider />

                {/* Inputs de Texto */}
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={user?.email} isReadOnly bg="gray.50" />
                </FormControl>

                <FormControl>
                  <FormLabel>Nombre Completo</FormLabel>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </FormControl>

                <Button type="submit" colorScheme="blue" isLoading={loadingProfile}>
                  Guardar Cambios
                </Button>
              </VStack>
            </form>
          </TabPanel>

          {/* --- PANEL 2: CONTRASEÑA --- */}
          <TabPanel>
            <form onSubmit={handleChangePassword}>
              <VStack spacing={4} align="start" maxW="md">
                <FormControl isRequired>
                  <FormLabel>Contraseña Actual</FormLabel>
                  <Input type="password" value={passActual} onChange={(e) => setPassActual(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <Input type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Repetir Nueva Contraseña</FormLabel>
                  <Input type="password" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} />
                </FormControl>
                <Button type="submit" colorScheme="red" mt={2} isLoading={loadingPass}>
                  Actualizar Contraseña
                </Button>
              </VStack>
            </form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default MiPerfil;