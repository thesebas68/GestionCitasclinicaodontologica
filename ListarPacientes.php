<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

$sql = "SELECT id, nombre, documento, telefono, correo FROM pacientes ORDER BY id DESC";
$res = $conexion->query($sql);

$pacientes = [];
while ($row = $res->fetch_assoc()) {
    $pacientes[] = $row;
}

echo json_encode($pacientes);

$conexion->close();
