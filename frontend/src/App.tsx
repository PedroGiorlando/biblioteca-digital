import { Outlet, useLocation } from 'react-router-dom'; 
import { Box, Flex, Container } from '@chakra-ui/react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// 1. Creamos un sub-componente "inteligente"
const PageContainer = () => {
  const location = useLocation();

  // 2. Comprobamos si estamos en una página de admin
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isAdminPage) {
    // 3. Si es admin, usamos un Box simple (ancho completo)
    // El padding (p) lo manejará el AdminLayout
    return (
      <Box flex="1">
        <Outlet />
      </Box>
    );
  }

  // 4. Si es pública, usamos el Container centrado
  return (
    <Container maxW="container.xl" flex="1" p={4}>
      <Outlet />
    </Container>
  );
};


function App() {
  return (
    <Flex direction="column" minH="100vh">
      <Navbar />

      {/* 5. Usamos nuestro nuevo PageContainer */}
      <PageContainer />

      <Footer />
    </Flex>
  );
}

export default App;