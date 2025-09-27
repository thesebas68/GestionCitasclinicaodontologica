<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include "ConexionDb.php";

// Leer el input JSON
$input = file_get_contents("php://input");
$datos = json_decode($input, true);

if (!$datos) {
    echo json_encode(["success" => false, "message" => "Datos JSON inválidos"]);
    exit;
}

$id = intval($datos["id"] ?? 0);
$estado = $datos["estado"] ?? "";

// Validar datos
$estadosPermitidos = ['pendiente', 'confirmada', 'cancelada'];
if (!$id || !in_array($estado, $estadosPermitidos)) {
    echo json_encode(["success" => false, "message" => "Datos inválidos"]);
    exit;
}

try {
    $stmt = $conexion->prepare("UPDATE citas SET estado = ? WHERE id = ?");
    $stmt->bind_param("si", $estado, $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "Estado actualizado correctamente"]);
        } else {
            echo json_encode(["success" => false, "message" => "No se encontró la cita o no hubo cambios"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Error en la base de datos: " . $conexion->error]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$conexion->close();
?>