<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include "ConexionDb.php";

$sql = "SELECT c.id, c.paciente_id, p.nombre AS paciente, c.fecha, c.hora, c.odontologo, c.estado 
        FROM citas c
        JOIN pacientes p ON c.paciente_id = p.id
        ORDER BY c.fecha DESC, c.hora DESC";

$res = $conexion->query($sql);

$citas = [];
while ($row = $res->fetch_assoc()) {
    $citas[] = $row;
}

echo json_encode($citas);

$conexion->close();
?>