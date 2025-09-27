<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

// Recibir JSON
$datos = json_decode(file_get_contents("php://input"), true);

$nombre     = isset($datos["nombre"]) ? trim($datos["nombre"]) : "";
$documento  = isset($datos["documento"]) ? trim($datos["documento"]) : "";
$telefono   = isset($datos["telefono"]) ? trim($datos["telefono"]) : "";
$correo     = isset($datos["correo"]) ? trim($datos["correo"]) : "";

// Validación
if (empty($nombre)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "El nombre del paciente es obligatorio"
    ]);
    exit;
}

// Preparar consulta
$stmt = $conexion->prepare("INSERT INTO pacientes (nombre, documento, telefono, correo) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $nombre, $documento, $telefono, $correo);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Paciente registrado correctamente",
        "id" => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al registrar el paciente: " . $conexion->error
    ]);
}

$stmt->close();
$conexion->close();
?>
