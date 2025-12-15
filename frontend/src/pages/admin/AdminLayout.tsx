import { Flex, Box } from '@chakra-ui/react'; // 1. Importar Box
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function AdminLayout() {
  return (
    <Flex>
      {/* Sidebar (fijo, no se encoge) */}
      <Box flexShrink={0}>
        <Sidebar />
      </Box>

      {/* Content Area (con padding y scroll) */}
      <Box flex="1" p={10} overflowX="auto">
        <Outlet />
      </Box>
    </Flex>
  );
}

export default AdminLayout;