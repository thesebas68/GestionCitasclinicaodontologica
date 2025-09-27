-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-09-2025 a las 04:57:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `clinica_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `odontologo` varchar(100) DEFAULT NULL,
  `estado` enum('pendiente','confirmada','cancelada') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id`, `paciente_id`, `fecha`, `hora`, `odontologo`, `estado`) VALUES
(2, 2, '2025-02-10', '10:00:00', 'Dra. Laura Gómez', 'confirmada'),
(3, 3, '2025-02-10', '11:00:00', 'Dr. Andrés Ramírez', 'cancelada'),
(5, 5, '2025-02-11', '10:30:00', 'Dr. Felipe Martínez', 'confirmada'),
(7, 7, '2025-02-12', '08:00:00', 'Dr. Julián Peña', 'confirmada'),
(9, 9, '2025-02-12', '10:00:00', 'Dr. Esteban Suárez', 'cancelada'),
(11, 11, '2025-02-13', '10:15:00', 'Dr. Ricardo Ortiz', 'confirmada'),
(12, 12, '2025-02-13', '11:15:00', 'Dra. Valentina Ríos', 'pendiente'),
(13, 13, '2025-02-14', '08:45:00', 'Dr. Mateo López', 'cancelada'),
(15, 15, '2025-02-14', '10:45:00', 'Dr. Sebastián Cárdenas', 'pendiente'),
(16, 16, '2025-02-15', '09:00:00', 'Dra. Paula Navarro', 'confirmada'),
(17, 17, '2025-02-15', '10:00:00', 'Dr. Juan Patiño', 'pendiente'),
(18, 18, '2025-02-15', '11:00:00', 'Dra. Ana Gutiérrez', 'cancelada'),
(19, 19, '2025-02-16', '08:30:00', 'Dr. Diego Silva', 'confirmada'),
(20, 20, '2025-02-16', '09:30:00', 'Dra. Carolina Ríos', 'pendiente'),
(21, 1, '2025-02-17', '10:00:00', 'Dr. Juan Pérez', 'pendiente'),
(22, 2, '2025-02-17', '11:00:00', 'Dra. Laura Gómez', 'confirmada'),
(23, 3, '2025-02-18', '08:30:00', 'Dr. Andrés Ramírez', 'pendiente'),
(24, 4, '2025-02-18', '09:30:00', 'Dra. Sofía Herrera', 'cancelada'),
(25, 5, '2025-02-18', '10:30:00', 'Dr. Felipe Martínez', 'confirmada'),
(26, 6, '2025-02-19', '08:45:00', 'Dra. Camila Torres', 'pendiente'),
(27, 7, '2025-02-19', '09:45:00', 'Dr. Julián Peña', 'pendiente'),
(28, 8, '2025-02-19', '10:45:00', 'Dra. Isabel Vargas', 'confirmada'),
(29, 9, '2025-02-20', '09:00:00', 'Dr. Esteban Suárez', 'pendiente'),
(30, 10, '2025-02-20', '10:00:00', 'Dra. Daniela Castro', 'cancelada'),
(31, 24, '2025-09-01', '15:02:00', 'Sebastian Tique', 'pendiente'),
(32, 24, '2025-09-03', '15:12:00', 'Sebastian Tique', 'confirmada'),
(33, 9, '2025-02-20', '09:00:00', 'Dr. Esteban Suárez', 'confirmada'),
(34, 24, '2025-09-01', '15:02:00', 'Sebastian Tique', 'pendiente'),
(35, 24, '2025-09-04', '16:12:00', 'Sebastian', 'pendiente'),
(36, 13, '2025-09-09', '20:33:00', 'Sebastian', 'confirmada'),
(37, 5, '2025-09-16', '17:16:00', 'pruebas', 'pendiente'),
(38, 27, '2025-09-23', '18:25:00', 'Sebastian Tique', 'cancelada'),
(40, 32, '2025-09-30', '07:26:00', 'Sebastian Obando', 'pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `documento` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `nombre`, `documento`, `telefono`, `correo`) VALUES
(1, 'Sebastian', '10063333', '33333', 'tiquea043@gmail.com'),
(2, 'Sebastian', '1006332', '3333332', 'tiquea02@gmail.com'),
(3, 'Anderson', '100633332', '33333324', 'tiquea3@gmail.com'),
(4, 'Tique', '1002333323', '333331', 'tiquea02@gmail.com'),
(5, 'Carlos Gómez', '1001001', '3001112233', 'carlos.gomez@example.com'),
(6, 'María Rodríguez', '1001002', '3002223344', 'maria.rodriguez@example.com'),
(7, 'Andrés López', '1001003', '3003334455', 'andres.lopez@example.com'),
(8, 'Laura Martínez', '1001004', '3004445566', 'laura.martinez@example.com'),
(9, 'Felipe Torres', '1001005', '3005556677', 'felipe.torres@example.com'),
(10, 'Camila Herrera', '1001006', '3006667788', 'camila.herrera@example.com'),
(11, 'Julián Ramírez', '1001007', '3007778899', 'julian.ramirez@example.com'),
(12, 'Sofía Morales', '1001008', '3008889900', 'sofia.morales@example.com'),
(13, 'Esteban Castro', '1001009', '3009990011', 'esteban.castro@example.com'),
(14, 'Daniela Vargas', '1001010', '3011112233', 'daniela.vargas@example.com'),
(15, 'Ricardo Peña', '1001011', '3012223344', 'ricardo.pena@example.com'),
(16, 'Valentina Ortiz', '1001012', '3013334455', 'valentina.ortiz@example.com'),
(17, 'Mateo Cárdenas', '1001013', '3014445566', 'mateo.cardenas@example.com'),
(18, 'Isabella Suárez', '1001014', '3015556677', 'isabella.suarez@example.com'),
(19, 'Sebastián Ríos', '1001015', '3016667788', 'sebastian.rios@example.com'),
(20, 'Paula Mendoza', '1001016', '3017778899', 'paula.mendoza@example.com'),
(21, 'Juan David Patiño', '1001017', '3018889900', 'juan.patino@example.com'),
(22, 'Ana María Gutiérrez', '1001018', '3021112233', 'ana.gutierrez@example.com'),
(23, 'Diego Navarro', '1001019', '3022223344', 'diego.navarro@example.com'),
(24, 'Carolina Silva', '1001020', '3023334455', 'carolina.silva@example.com'),
(25, 'Sebastian', '10063333', '33333', 'tiquea02@gmail.com'),
(26, 'pruebas', '111111', '222222', 'tiquea043@gmail.com'),
(27, 'asdsad', '100633332', '333332', 'tiquea022@gmail.com'),
(28, 'Sebas', '1111', '222', 'tiwue11@gmail.com'),
(29, 'Tiwue', '33333', '2222', 'tiwuew11@gmail.com'),
(30, 'Pruebas123', '32222', '333333', 'tiwuew1331@gmail.com'),
(31, 'Sebastian', '10063333', '33333', 'tiquea02@gmail.com'),
(32, 'Sebastian Vettel', '111122233', '32542554', 'tiquerr31@gmail.com');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
