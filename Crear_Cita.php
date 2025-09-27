<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

$datos = json_decode(file_get_contents("php://input"), true);

$paciente_id = intval($datos["paciente_id"] ?? 0);
$fecha       = $datos["fecha"] ?? "";
$hora        = $datos["hora"] ?? "";
$odontologo  = $datos["odontologo"] ?? "";
$estado      = $datos["estado"] ?? "pendiente";

if (!$paciente_id || !$fecha || !$hora) {
    echo json_encode(["success" => false, "message" => "Faltan campos obligatorios"]);
    exit;
}

$stmt = $conexion->prepare("INSERT INTO citas (paciente_id, fecha, hora, odontologo, estado) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("issss", $paciente_id, $fecha, $hora, $odontologo, $estado);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "id" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "message" => $conexion->error]);
}

$stmt->close();
$conexion->close();
