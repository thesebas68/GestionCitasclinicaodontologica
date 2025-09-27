<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, PATCH");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

$datos = json_decode(file_get_contents("php://input"), true);

$id          = intval($datos["id"] ?? 0);
$paciente_id = intval($datos["paciente_id"] ?? 0);
$fecha       = $datos["fecha"] ?? "";
$hora        = $datos["hora"] ?? "";
$odontologo  = $datos["odontologo"] ?? "";
$estado      = $datos["estado"] ?? "";

if (!$id || !$paciente_id || !$fecha || !$hora) {
    echo json_encode(["success" => false, "message" => "Faltan datos"]);
    exit;
}

$stmt = $conexion->prepare("UPDATE citas SET paciente_id=?, fecha=?, hora=?, odontologo=?, estado=? WHERE id=?");
$stmt->bind_param("issssi", $paciente_id, $fecha, $hora, $odontologo, $estado, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Cita actualizada"]);
} else {
    echo json_encode(["success" => false, "message" => $conexion->error]);
}

$stmt->close();
$conexion->close();
?>