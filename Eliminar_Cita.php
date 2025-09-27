<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: DELETE, POST");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

$datos = json_decode(file_get_contents("php://input"), true);
$id = intval($datos["id"] ?? 0);

if (!$id) {
    echo json_encode(["success" => false, "message" => "ID inválido"]);
    exit;
}

$stmt = $conexion->prepare("DELETE FROM citas WHERE id=?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Cita eliminada"]);
} else {
    echo json_encode(["success" => false, "message" => $conexion->error]);
}

$stmt->close();
$conexion->close();
?>