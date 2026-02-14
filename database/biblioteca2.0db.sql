CREATE DATABASE  IF NOT EXISTS `biblioteca_digital` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `biblioteca_digital`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: biblioteca_digital
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adquisiciones`
--

DROP TABLE IF EXISTS `adquisiciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adquisiciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_libro` int NOT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `tiene_descuento` tinyint(1) DEFAULT '0',
  `fecha_adquisicion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_compra` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_propiedad` (`id_usuario`,`id_libro`),
  KEY `id_libro` (`id_libro`),
  CONSTRAINT `adquisiciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `adquisiciones_ibfk_2` FOREIGN KEY (`id_libro`) REFERENCES `libros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adquisiciones`
--

LOCK TABLES `adquisiciones` WRITE;
/*!40000 ALTER TABLE `adquisiciones` DISABLE KEYS */;
INSERT INTO `adquisiciones` VALUES (1,5,6,7.50,1,'2026-02-05 19:10:15','2026-02-07 17:18:21'),(2,5,21,15.00,0,'2026-02-05 19:33:24','2026-02-07 17:18:21'),(3,5,18,15.00,0,'2026-02-05 19:33:41','2026-02-07 17:18:21'),(4,5,5,15.00,0,'2026-02-05 19:47:07','2026-02-07 17:18:21'),(5,5,20,15.00,0,'2026-02-05 20:02:20','2026-02-07 17:18:21'),(6,5,3,15.00,0,'2026-02-09 22:31:16','2026-02-09 19:31:16'),(7,9,6,15.00,0,'2026-02-10 02:37:29','2026-02-09 23:37:29');
/*!40000 ALTER TABLE `adquisiciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deseados`
--

DROP TABLE IF EXISTS `deseados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deseados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_libro` int NOT NULL,
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_deseado` (`id_usuario`,`id_libro`),
  KEY `id_libro` (`id_libro`),
  CONSTRAINT `deseados_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deseados_ibfk_2` FOREIGN KEY (`id_libro`) REFERENCES `libros` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deseados`
--

LOCK TABLES `deseados` WRITE;
/*!40000 ALTER TABLE `deseados` DISABLE KEYS */;
INSERT INTO `deseados` VALUES (11,5,17,'2026-02-09 22:32:26'),(12,1,23,'2026-02-10 00:54:42'),(13,1,6,'2026-02-10 02:30:17'),(15,9,6,'2026-02-10 02:37:20');
/*!40000 ALTER TABLE `deseados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `libros`
--

DROP TABLE IF EXISTS `libros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `libros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `autor` varchar(100) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `fecha_publicacion` date DEFAULT NULL,
  `portada_url` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `precio` decimal(10,2) NOT NULL DEFAULT '15.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `libros`
--

LOCK TABLES `libros` WRITE;
/*!40000 ALTER TABLE `libros` DISABLE KEYS */;
INSERT INTO `libros` VALUES (2,'El Señor de los Anillos','J.R.R. Tolkien','Fantasía',NULL,NULL,NULL,0,15.00),(3,'El nombre del viento','Patrick Rothfuss','Fantasía','La primera parte de la Crónica del Asesino de Reyes.','2007-03-27','uploads/1763428550556-658947522.jpg',1,15.00),(4,'JavaScript: The Good Parts','Douglas Crockford','Programación','Un libro clásico sobre cómo usar JavaScript correctamente.','2008-05-01','uploads/1763839601648-722977178.jpg',1,15.00),(5,'Dune','Frank Herbert','Ciencia Ficción','La historia de Paul Atreides en el planeta desierto Arrakis.','1965-08-01','uploads/1763428474158-856525602.jpg',1,15.00),(6,'1984','George Orwell','Distopía','Una novela clásica sobre la vigilancia gubernamental y la opresión totalitaria.','1949-06-08','uploads/1763425275500-958587775.jpg',1,15.00),(7,'Orgullo y Prejuicio','Jane Austen','Clásico','Una comedia romántica de costumbres en la Inglaterra del siglo XIX.','1813-01-28','uploads/libro-1770778439476-842499763.jpg',1,15.00),(8,'Juego de Tronos','George R.R. Martin','Fantasía','El primer libro de la serie Canción de Hielo y Fuego, lleno de intriga política y guerra.','1996-08-01','uploads/libro-1770778243030-988601623.jpg',1,15.00),(9,'La Artesanía del Código Limpio','Robert C. Martin','Programación','Un manual de agilidad y buenas prácticas en el desarrollo de software.','2008-08-01','uploads/1763428441459-94505548.jpg',1,15.00),(10,'Meditaciones','Marco Aurelio','Filosofía','Escritos personales del emperador romano sobre la filosofía estoica.','0180-01-01','uploads/libro-1770778434918-929888147.jpg',1,15.00),(11,'La chica del dragón tatuado','Stieg Larsson','Misterio','Un misterio que involucra a un periodista y una hacker investigando una desaparición.','2005-08-01','uploads/libro-1770778427479-23605610.jpg',1,15.00),(12,'It (Eso)','Stephen King','Terror','Un grupo de niños es aterrorizado por una entidad malévola que toma la forma de sus peores miedos.','1986-09-15',NULL,0,15.00),(13,'Steve Jobs','Walter Isaacson','Biografía','La biografía autorizada del cofundador de Apple, basada en más de 40 entrevistas.','2011-10-24','uploads/libro-1770778443613-615469055.jpg',1,15.00),(14,'Un mundo feliz','Aldous Huxley','Distopía','Una novela futurista sobre una sociedad genéticamente modificada y controlada.','1932-01-01','uploads/libro-1770778447543-727473609.jpg',1,15.00),(15,'Fundación','Isaac Asimov','Ciencia Ficción','El primer libro de la aclamada trilogía.','1951-06-01','uploads/libro-1770778237098-245666995.jpg',1,15.00),(16,'Elantris','Brandon Sanderson','Fantasía','Una ciudad de dioses caídos y un misterio por resolver.','2005-04-21','uploads/1763428621554-220980348.jpg',1,15.00),(17,'El Programador Pragmático','Andrew Hunt y David Thomas','Programación','Un viaje desde aprendiz hasta maestro en el desarrollo de software.','1999-10-20','uploads/1763428589095-76935618.jpg',1,15.00),(18,'Cien Años de Soledad','Gabriel García Márquez','Realismo Mágico','La saga de la familia Buendía en el pueblo ficticio de Macondo.','1967-05-30','uploads/1763428400809-253712260.jpg',1,15.00),(19,'La Casa de Hojas','Mark Z. Danielewski','Terror','Una historia sobre una casa que es más grande por dentro que por fuera.','2000-03-07','uploads/libro-1770778421091-803210980.jpg',1,15.00),(20,'El Hombre en Busca de Sentido','Viktor Frankl','Filosofía','Las memorias de un psiquiatra sobre su vida en los campos de concentración nazis.','1946-01-01','uploads/1763428512332-30833693.jpg',1,15.00),(21,'Asesinato en el Orient Express','Agatha Christie','Misterio','Hércules Poirot investiga un asesinato en el famoso tren.','1934-01-01','uploads/1763428363220-654926246.jpg',1,15.00),(22,'Fahrenheit 451','Ray Bradbury','Distopía','Una sociedad futura donde los libros están prohibidos y son quemados por \"bomberos\".','1953-10-19','uploads/libro-1770778118721-749233289.jpg',1,15.00),(23,'Libro Ejemplo','ejemplo','ejemplo','texto de ejemplo','2026-02-03',NULL,0,15.00);
/*!40000 ALTER TABLE `libros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resenas`
--

DROP TABLE IF EXISTS `resenas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resenas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_libro` int NOT NULL,
  `calificacion` int NOT NULL,
  `comentario` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_resena` (`id_usuario`,`id_libro`),
  KEY `id_libro` (`id_libro`),
  CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`id_libro`) REFERENCES `libros` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resenas_chk_1` CHECK (((`calificacion` >= 1) and (`calificacion` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resenas`
--

LOCK TABLES `resenas` WRITE;
/*!40000 ALTER TABLE `resenas` DISABLE KEYS */;
INSERT INTO `resenas` VALUES (1,1,6,4,'Muy bueno','2025-11-19 23:16:06'),(2,5,5,4,'Muy buen libro','2026-02-05 19:47:23'),(3,5,17,4,'Muy bueno! ','2026-02-09 22:32:54');
/*!40000 ALTER TABLE `resenas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('Administrador','Usuario Registrado') NOT NULL DEFAULT 'Usuario Registrado',
  `foto_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Pedro Giorlando','pedro@correo.com','$2b$10$caFyYOkdkWo4sMcMCEG84.FjPcaW09WmKFYIyA7UB4PcckwrRGEa.','Administrador','uploads/foto-1770692466759-877690865.jpeg'),(2,'Usuario Test','usuario@test.com','$2b$10$.XFPaEN9zxPB3d1OOvhQiOml6Rs5pBFq7/BKbCvk/Eb2Hf1rQt7WC','Usuario Registrado',NULL),(3,'Usuario Test 2','usuario@test2.com','$2b$10$Rq/5yUwjVDN5yUvMUBUMsOuQA/i1Cn0wcpPOngVilpW6/l75Es6GW','Usuario Registrado',NULL),(5,'Usuario 1','usuariotest@mail.com','$2b$10$TiXLpjUtsmblk5UnQE0w0uD8cAizY5JjET.KkG3yFXm5ILvIprXty','Usuario Registrado','uploads/foto-1770683234418-373087023.png'),(7,'Juan Pérez','juan@correo.com','$2b$10$UVLSsGFkk8GypWZTRt05muOIFlq81ONwW1v1lkLIU8NpIszobqEXy','Usuario Registrado',NULL),(8,'Paula Giorlando','paula@mail.com','$2b$10$/b4QwtOZ/pBO8DVVigVQuOvh72GVziBgM1Fta8apP4DiQ/XNaTUEy','Administrador',NULL),(9,'Test Usuario Ejemplo','ejemplo@ejemplo.com','$2b$10$qlSETbK7VweJtm4w.W57CeJJ0Bpv868jEG6CnGUiEFJut9tcRLeUW','Usuario Registrado','uploads/foto-1770692049917-897174781.jpeg');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11 11:56:43
