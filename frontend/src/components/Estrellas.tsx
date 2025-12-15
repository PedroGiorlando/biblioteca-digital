import { HStack, Icon } from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';

interface Props {
  calificacion: number; // Del 1 al 5
  max?: number;
  size?: string;
}

function Estrellas({ calificacion, max = 5, size = "md" }: Props) {
  return (
    <HStack spacing={1}>
      {[...Array(max)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <Icon
            as={FaStar}
            key={index}
            // Si la estrella actual es menor o igual a la calificación, es amarilla
            color={ratingValue <= calificacion ? "yellow.400" : "gray.300"}
            boxSize={size === "lg" ? 6 : 4}
          />
        );
      })}
    </HStack>
  );
}

export default Estrellas;