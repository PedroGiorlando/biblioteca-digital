import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// 1. Configuración del modo de color
const config: ThemeConfig = {
  initialColorMode: 'light', // Empieza en modo claro
  useSystemColorMode: false, // No obligues a usar la config del sistema
};

const theme = extendTheme({
  config, // <-- Añadimos la config aquí
  fonts: {
    heading: `'Montserrat', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
  },
  // Actualizamos los estilos globales para que el fondo cambie solo
  styles: {
    global: (props: any) => ({
      body: {
        // "mode(claro, oscuro)" es una función mágica de Chakra
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      },
    }),
  },
});

export default theme;