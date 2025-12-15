import { Box, Text } from '@chakra-ui/react';

function Footer() {
  return (
    <Box as="footer" bg="brand.800" color="white" p={6} mt="auto" textAlign="center">
      <Text fontSize="sm" opacity={0.8}>
        © 2025 Biblioteca Digital. Todos los derechos reservados.
      </Text>
    </Box>
  );
}

export default Footer;