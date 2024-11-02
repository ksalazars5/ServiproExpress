const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');  
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const xlsx = require('xlsx'); // Asegúrate de que esto esté presente

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'serviproexpress',
    host: 'dpg-crfnl556l47c73e2jql0-a.frankfurt-postgres.render.com',
    database: 'serviproexpress_db',
    password: 'bfzmrbv0LEwW8l6kdBQNvuQDFDQpjnNT',
    port: 5432,
    ssl: {
        rejectUnauthorized: false 
    }
});

(async () => {
    try {
        const client = await pool.connect();
        console.log('Conexión exitosa a la base de datos');
        await client.release();
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
    }
})();
// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM USUARIO WHERE ID_USUARIO = $1 AND PASSWORD = $2',
            [username, password]
        );
        
        if (result.rows.length > 0) {
            res.redirect('/success');
        } else {
            res.send('Usuario o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    }
});


// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));
//limpieza a la base de datos limpieza
app.get('/empleos-limpieza', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM reclutamiento WHERE id_categoria = 2');
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.json([]); // Devuelve un array vacío si no hay resultados
        }
    } catch (err) {
        console.error('Error al obtener empleos de limpieza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
// Endpoint para añadir una nueva plaza limpieza
app.post('/add-plaza-limpieza', async (req, res) => {
    const { descripcion, disponible, fecha_creacion } = req.body;
    const client = await pool.connect();
    try {
        // Inserta el nuevo empleo en la base de datos
        const result = await client.query(
            'INSERT INTO RECLUTAMIENTO (ID_CATEGORIA, DESCRIPCION, DISPONIBLE, FECHA_CREACION) VALUES ($1, $2, $3, $4)',
            [2, descripcion, disponible, fecha_creacion] // Asumiendo que 2 es el ID de la categoría "seguridad"
        );
        res.status(201).json({ message: 'Plaza añadida exitosamente.' });
    } catch (err) {
        console.error('Error al añadir la plaza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
// Endpoint para actualizar la visibilidad de una plaza (PUT request) limpieza
app.put('/toggle-visibility/:id', async (req, res) => {
    const { id } = req.params;
    const { visible } = req.body; // true o false
    try {
        await pool.query('UPDATE RECLUTAMIENTO SET DISPONIBLE = $1 WHERE id_reclutamiento = $2', [visible, id]);
        res.status(200).send('Visibilidad de la plaza actualizada');
    } catch (err) {
        console.error('Error al actualizar la visibilidad:', err.message);
        res.status(500).send('Error en el servidor');
    }
});
// Ruta para obtener solo las plazas visibles de limpieza
app.get('/plazas-limpieza', async (req, res) => {
    try {
        const plazasVisibles = await obtenerPlazasVisibles(); // Asegúrate de que esta función retorne solo plazas visibles
        res.json(plazasVisibles);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las plazas visibles' });
    }
});
// Endpoint para obtener las plazas de limpieza
app.get('/plazas', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM RECLUTAMIENTO');
        res.json(result.rows); // Enviar todas las plazas al frontend
    } catch (err) {
        console.error('Error al obtener las plazas:', err.message);
        res.status(500).send('Error en el servidor');
    } finally {
        client.release();
    }
});
// Endpoint para eliminar una plaza de limpieza
app.delete('/delete-plaza/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID de los parámetros de la URL
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM RECLUTAMIENTO WHERE id_reclutamiento = $1', [id]);
        if (result.rowCount > 0) {
            res.status(200).send('Plaza eliminada exitosamente.');
        } else {
            res.status(404).send('Plaza no encontrada.');
        }
    } catch (err) {
        console.error('Error al eliminar la plaza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
app.post('/guardar-datos', async (req, res) => {
    // Obtener los datos del formulario de limpieza
    const {
        nombres,
        apellidos,
        tel1,
        tel2,
        correo,
        direccion,
        edad,
        dpi,
        estado_civil,
        genero,
        grado_academico,
        anos_experiencia,
        disposicion_horarios,
        motivo_renuncia,
        hurto,
        manejo_presupuesto,
        permiso_telefono,
        encuentro_dinero,
        revisar_tarea,
        encuentro_objeto,
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en la tabla DATOS_GENERALES
        const resultDatosGenerales = await client.query(
            'INSERT INTO DATOS_GENERALES (NOMBRES, APELLIDOS, TEL1, TEL2, CORREO, DIRECCION, EDAD, DPI, ESTADO_CIVIL, GENERO, ID_CATEGORIA) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ID_PREGUNTA',
            [nombres, apellidos, tel1, tel2, correo, direccion, edad, dpi, estado_civil, genero, 2] // ID_CATEGORIA = 2 para limpieza
        );

        const idDatosGenerales = resultDatosGenerales.rows[0].id_pregunta;

        // Insertar en la tabla RESPUESTAS_LIMPIEZA
        await client.query(
            'INSERT INTO RESPUESTAS_LIMPIEZA (ID_DATOS_GENERALES, GRADO_ACADEMICO, ANOS_EXPERIENCIA, DISPOSICION_HORARIOS, MOTIVO_RENUNCIA, HURTO, MANEJO_PRESUPUESTO, PERMISO_TELEFONO, ENCUENTRO_DINERO, REVISAR_TAREA, ENCUENTRO_OBJETO) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [idDatosGenerales, grado_academico, anos_experiencia, disposicion_horarios, motivo_renuncia, hurto, manejo_presupuesto, permiso_telefono, encuentro_dinero, revisar_tarea, encuentro_objeto]
        );

        await client.query('COMMIT'); // Hacer commit si todo es exitoso

        // Enviar respuesta HTML para mostrar el alert
        res.send(`
            <html>
                <head>
                    <script>
                        alert('Datos de limpieza añadidos exitosamente.');
                        window.location.href = '/empleos-limpieza.html'; // Redirigir a donde desees
                    </script>
                </head>
                <body></body>
            </html>
        `);
    } catch (err) {
        await client.query('ROLLBACK'); // Hacer rollback en caso de error
        console.error('Error al añadir los datos de limpieza:', err.message);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
});

// Configura body-parser para manejar solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Endpoint para obtener empleos de seguridad
app.get('/empleos-seguridad', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM reclutamiento WHERE id_categoria = 3');
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.json([]); // Devuelve un array vacío si no hay resultados
        }
    } catch (err) {
        console.error('Error al obtener empleos de seguridad:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
// Endpoint para añadir una nueva plaza seguridad
app.post('/add-plaza-seguridad', async (req, res) => {
    const { descripcion, disponible, fecha_creacion } = req.body;
    const client = await pool.connect();
    try {
        // Inserta el nuevo empleo en la base de datos
        const result = await client.query(
            'INSERT INTO RECLUTAMIENTO (ID_CATEGORIA, DESCRIPCION, DISPONIBLE, FECHA_CREACION) VALUES ($1, $2, $3, $4)',
            [3, descripcion, disponible, fecha_creacion] // Asumiendo que 3 es el ID de la categoría "seguridad"
        );
        res.status(201).json({ message: 'Plaza añadida exitosamente.' });
    } catch (err) {
        console.error('Error al añadir la plaza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
async function obtenerEmpleos() {
    try {
        const respuesta = await fetch('/empleos-seguridad');
        const empleos = await respuesta.json();
        console.log(empleos);  // Log para ver los empleos recibidos
        
        const listaEmpleos = document.getElementById('lista-empleos');
        listaEmpleos.innerHTML = '';

        if (empleos.length > 0) {
            empleos.forEach(empleo => {
                const li = document.createElement('li');
                li.textContent = empleo.descripcion + ' - ' + empleo.ubicacion;
                listaEmpleos.appendChild(li);
            });
        } else {
            listaEmpleos.innerHTML = '<li>No hay empleos disponibles en seguridad.</li>';
        }
    } catch (error) {
        console.error('Error al obtener empleos:', error);
    }
}
app.post('/guardar-datos-seguridad', async (req, res) => {
    // Obtener los datos del formulario de seguridad
    const {
        nombres,
        apellidos,
        tel1,
        tel2,
        correo,
        direccion,
        edad,
        dpi,
        estado_civil,
        genero,
        grado_academico,
        anios_experiencia,
        disponibilidad_rotativos,
        motivo_renuncia_despido,
        antecedentes,
        explicacion_antecedentes,
        detenciones,
        explicacion_detenciones,
        licencia_arma,
        tipo_licencia,
        funciones_seguridad,
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en la tabla DATOS_GENERALES
        const resultDatosGenerales = await client.query(
            'INSERT INTO DATOS_GENERALES (NOMBRES, APELLIDOS, TEL1, TEL2, CORREO, DIRECCION, EDAD, DPI, ESTADO_CIVIL, GENERO, ID_CATEGORIA) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ID_PREGUNTA',
            [nombres, apellidos, tel1, tel2, correo, direccion, edad, dpi, estado_civil, genero, 3] // ID_CATEGORIA = 3 para seguridad
        );

        const idDatosGenerales = resultDatosGenerales.rows[0].id_pregunta;

        // Insertar en la tabla RESPUESTAS_SEGURIDAD
        await client.query(
            `INSERT INTO RESPUESTAS_SEGURIDAD (ID_DATOS_GENERALES, GRADO_ACADEMICO, ANIOS_EXPERIENCIA, DISPONIBILIDAD_ROTATIVOS, MOTIVO_RENUNCIA_DESPIDO, 
            ANTECEDENTES, EXPLICACION_ANTECEDENTES, DETENCIONES, EXPLICACION_DETENCIONES, LICENCIA_ARMA, TIPO_LICENCIA, FUNCIONES_SEGURIDAD) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [idDatosGenerales, grado_academico, anios_experiencia, disponibilidad_rotativos, motivo_renuncia_despido, 
            antecedentes, explicacion_antecedentes, detenciones, explicacion_detenciones, licencia_arma, tipo_licencia, funciones_seguridad]
        );

        await client.query('COMMIT'); // Confirmar la transacción

        // Enviar respuesta HTML con alerta y redirección
        res.send(`
            <html>
                <head>
                    <script>
                        alert('Datos de seguridad añadidos exitosamente.');
                        window.location.href = '/empleos-seguridad.html'; // Redirigir a la página deseada
                    </script>
                </head>
                <body></body>
            </html>
        `);
    } catch (err) {
        await client.query('ROLLBACK'); // Hacer rollback en caso de error
        console.error('Error al añadir los datos de seguridad:', err.message);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release(); // Liberar la conexión
    }
});
// Endpoint para eliminar una plaza
app.delete('/delete-plaza-seguridad/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID de los parámetros de la URL
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM RECLUTAMIENTO WHERE id_reclutamiento = $1', [id]);
        if (result.rowCount > 0) {
            res.status(200).send('Plaza eliminada exitosamente.');
        } else {
            res.status(404).send('Plaza no encontrada.');
        }
    } catch (err) {
        console.error('Error al eliminar la plaza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
// Endpoint para obtener empleos de administración
app.get('/empleos-administracion', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM reclutamiento WHERE id_categoria = 4'); // Cambia el id_categoria según sea necesario
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.json([]); // Devuelve un array vacío si no hay resultados
        }
    } catch (err) {
        console.error('Error al obtener empleos de administración:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
// Endpoint para añadir una nueva plaza de administración
app.post('/add-plaza-administracion', async (req, res) => {
    const { descripcion, disponible, fecha_creacion } = req.body;
    const client = await pool.connect();
    try {
        // Inserta el nuevo empleo en la base de datos
        const result = await client.query(
            'INSERT INTO RECLUTAMIENTO (ID_CATEGORIA, DESCRIPCION, DISPONIBLE, FECHA_CREACION) VALUES ($1, $2, $3, $4)',
            [4, descripcion, disponible, fecha_creacion] 
        );
        res.status(201).json({ message: 'Plaza añadida exitosamente.' });
    } catch (err) {
        console.error('Error al añadir la plaza:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});
async function obtenerEmpleos() {
    try {
        const respuesta = await fetch('/empleos-administracion'); // Cambiado a '/empleos-administracion'
        const empleos = await respuesta.json();
        console.log(empleos);  // Log para ver los empleos recibidos
        
        const listaEmpleos = document.getElementById('lista-empleos');
        listaEmpleos.innerHTML = '';

        if (empleos.length > 0) {
            empleos.forEach(empleo => {
                const li = document.createElement('li');
                li.textContent = empleo.descripcion + ' - ' + empleo.ubicacion; // Asegúrate de que 'ubicacion' esté en tus datos
                listaEmpleos.appendChild(li);
            });
        } else {
            listaEmpleos.innerHTML = '<li>No hay empleos disponibles en administración.</li>'; // Mensaje actualizado
        }
    } catch (error) {
        console.error('Error al obtener empleos:', error);
    }
}
app.post('/guardar-datos-admin', async (req, res) => {
    const {
        nombres,
        apellidos,
        tel1,
        tel2,
        correo,
        direccion,
        edad,
        dpi,
        estado_civil,
        genero,
        grado_academico,
        anios_experiencia,
        disponibilidad_rotativos,
        motivo_renuncia,
        actividades_antiguo_trabajo,
        equipos_oficina_puede_usar,
        equipos_oficina_no_puede_usar,
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en la tabla DATOS_GENERALES con ID_CATEGORIA fijo (4 para Administración)
        const resultDatosGenerales = await client.query(
            `INSERT INTO DATOS_GENERALES (NOMBRES, APELLIDOS, TEL1, TEL2, CORREO, DIRECCION, EDAD, DPI, ESTADO_CIVIL, GENERO, ID_CATEGORIA) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING ID_PREGUNTA`,
            [nombres, apellidos, tel1, tel2, correo, direccion, edad, dpi, estado_civil, genero, 4]
        );

        const idDatosGenerales = resultDatosGenerales.rows[0].id_pregunta;

        // Insertar en la tabla RESPUESTAS_ADMINISTRACION
        await client.query(
            `INSERT INTO RESPUESTAS_ADMINISTRACION (ID_DATOS_GENERALES, GRADO_ACADEMICO, ANIOS_EXPERIENCIA, DISPONIBILIDAD_ROTATIVOS, 
            MOTIVO_RENUNCIA, ACTIVIDADES_ANTIGUO_TRABAJO, EQUIPOS_OFICINA_PUEDE_USAR, EQUIPOS_OFICINA_NO_PUEDE_USAR) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [idDatosGenerales, grado_academico, anios_experiencia, disponibilidad_rotativos, motivo_renuncia, 
            actividades_antiguo_trabajo, equipos_oficina_puede_usar, equipos_oficina_no_puede_usar]
        );

        await client.query('COMMIT'); // Confirmar la transacción

        // Enviar respuesta HTML con alerta y redirección
        res.send(`
            <html>
                <head>
                    <script>
                        alert('Datos de administración añadidos exitosamente.');
                        window.location.href = '/empleos-administracion.html'; // Redirigir a la página deseada
                    </script>
                </head>
                <body></body>
            </html>
        `);
    } catch (err) {
        await client.query('ROLLBACK'); // Hacer rollback en caso de error
        console.error('Error al añadir los datos de administración:', err.message);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release(); // Liberar la conexión
    }
});

// Endpoint para eliminar una plaza de administración
app.delete('/delete-plaza-administracion/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el ID de los parámetros de la URL
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM RECLUTAMIENTO WHERE id_reclutamiento = $1', [id]);
        if (result.rowCount > 0) {
            res.status(200).send('Plaza de administración eliminada exitosamente.');
        } else {
            res.status(404).send('Plaza no encontrada.');
        }
    } catch (err) {
        console.error('Error al eliminar la plaza de administración:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    } finally {
        client.release();
    }
});

app.get('/descargar-reportes-limpieza', async (req, res) => {
    const { genero, grado_academico } = req.query; // Lee ambos parámetros de la URL
    const client = await pool.connect();
    try {
        // Construye la consulta con los filtros de género y grado académico si se proporcionan
        let query = `
            SELECT dg.*, rl.*
            FROM DATOS_GENERALES dg
            JOIN RESPUESTAS_LIMPIEZA rl ON dg.ID_PREGUNTA = rl.ID_DATOS_GENERALES
            WHERE dg.ID_CATEGORIA = 2
        `; // 2 para limpieza

        const queryParams = []; // Para almacenar los parámetros de consulta

        // Agregar filtro de género si está presente
        if (genero) {
            query += ` AND dg.GENERO = $${queryParams.length + 1}`; // Agrega el filtro de género
            queryParams.push(genero.toUpperCase()); // Asegura que el género esté en mayúsculas
        }

        // Agregar filtro de grado académico si está presente
        if (grado_academico) {
            query += ` AND rl.GRADO_ACADEMICO = $${queryParams.length + 1}`; // Agrega el filtro de grado académico
            queryParams.push(grado_academico); // Agrega a los parámetros
        }

        // Ejecutar la consulta
        const result = await client.query(query, queryParams);
        const datos = result.rows;

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Limpieza');

        // Ajuste del encabezado a mayúsculas y aplicar estilo
        const header = Object.keys(datos[0] || {});
        worksheet.addRow(header.map(col => col.toUpperCase())); // Agregar la fila de encabezado

        // Aplicar estilos al encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E4DFEC' } // Color de fondo #E4DFEC
            };
            cell.font = {
                bold: true,
                color: { argb: '000000' } // Color de texto negro
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            };
        });

        // Agregar datos y aplicar alineación centrada
        datos.forEach(row => {
            const newRow = worksheet.addRow(Object.values(row));

            // Aplicar alineación centrada a las celdas de la fila
            newRow.eachCell((cell) => {
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            });
        });

        // Ajustar el ancho de las columnas automáticamente
        worksheet.columns.forEach(column => {
            const maxLength = column.values.reduce((max, value) => Math.max(max, (value || '').toString().length), 0);
            column.width = maxLength + 2; // +2 para dar un poco de espacio extra
        });

        // Envía el archivo Excel
        res.setHeader('Content-Disposition', `attachment; filename=reportes_limpieza_${genero || 'todos'}_${grado_academico || 'todos'}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res); // Escribir el archivo en la respuesta
        res.end(); // Finalizar la respuesta
    } catch (err) {
        console.error('Error al generar el Excel:', err.message);
        res.status(500).send('Error en el servidor');
    } finally {
        client.release();
    }
});


app.get('/descargar-reportes-seguridad', async (req, res) => {
    const { genero, grado_academico } = req.query; // Lee ambos parámetros de la URL
    const client = await pool.connect();
    try {
        // Construye la consulta con los filtros de género y grado académico si se proporcionan
        let query = `
            SELECT dg.*, rl.*
            FROM DATOS_GENERALES dg
            JOIN RESPUESTAS_SEGURIDAD rl ON dg.ID_PREGUNTA = rl.ID_DATOS_GENERALES
            WHERE dg.ID_CATEGORIA = 3
        `; // 3 para seguridad

        const queryParams = []; // Para almacenar los parámetros de consulta

        // Agregar filtro de género si está presente
        if (genero) {
            query += ` AND dg.GENERO = $${queryParams.length + 1}`; // Agrega el filtro de género
            queryParams.push(genero.toUpperCase()); // Asegura que el género esté en mayúsculas
        }

        // Agregar filtro de grado académico si está presente
        if (grado_academico) {
            query += ` AND rl.GRADO_ACADEMICO = $${queryParams.length + 1}`; // Agrega el filtro de grado académico
            queryParams.push(grado_academico); // Agrega a los parámetros
        }

        // Ejecutar la consulta
        const result = await client.query(query, queryParams);
        const datos = result.rows;

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Seguridad');

        // Ajuste del encabezado a mayúsculas y aplicar estilo
        const header = Object.keys(datos[0] || {});
        worksheet.addRow(header.map(col => col.toUpperCase())); // Agregar la fila de encabezado

        // Aplicar estilos al encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E4DFEC' } // Color de fondo #E4DFEC
            };
            cell.font = {
                bold: true,
                color: { argb: '000000' } // Color de texto negro
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            };
        });

        // Agregar datos y aplicar alineación centrada
        datos.forEach(row => {
            const newRow = worksheet.addRow(Object.values(row));

            // Aplicar alineación centrada a las celdas de la fila
            newRow.eachCell((cell) => {
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            });
        });

        // Ajustar el ancho de las columnas automáticamente
        worksheet.columns.forEach(column => {
            const maxLength = column.values.reduce((max, value) => Math.max(max, (value || '').toString().length), 0);
            column.width = maxLength + 2; // +2 para dar un poco de espacio extra
        });

        // Envía el archivo Excel
        res.setHeader('Content-Disposition', `attachment; filename=reportes_seguridad_${genero || 'todos'}_${grado_academico || 'todos'}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res); // Escribir el archivo en la respuesta
        res.end(); // Finalizar la respuesta
    } catch (err) {
        console.error('Error al generar el Excel:', err.message);
        res.status(500).send('Error en el servidor');
    } finally {
        client.release();
    }
});

const ExcelJS = require('exceljs');

app.get('/descargar-reportes-administracion', async (req, res) => {
    const { genero, grado_academico } = req.query; // Lee ambos parámetros de la URL
    const client = await pool.connect();
    try {
        // Construye la consulta con los filtros de género y grado académico si se proporcionan
        let query = `
            SELECT dg.*, rl.*
            FROM DATOS_GENERALES dg
            JOIN RESPUESTAS_ADMINISTRACION rl ON dg.ID_PREGUNTA = rl.ID_DATOS_GENERALES
            WHERE dg.ID_CATEGORIA = 4
        `; // 4 para administración

        const queryParams = []; // Para almacenar los parámetros de consulta

        // Agregar filtro de género si está presente
        if (genero) {
            query += ` AND dg.GENERO = $${queryParams.length + 1}`; // Agrega el filtro de género
            queryParams.push(genero.toUpperCase()); // Asegura que el género esté en mayúsculas
        }

        // Agregar filtro de grado académico si está presente
        if (grado_academico) {
            query += ` AND rl.GRADO_ACADEMICO = $${queryParams.length + 1}`; // Agrega el filtro de grado académico
            queryParams.push(grado_academico); // Agrega a los parámetros
        }

        // Ejecutar la consulta
        const result = await client.query(query, queryParams);
        const datos = result.rows;

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Administracion');

        // Ajuste del encabezado a mayúsculas y aplicar estilo
        const header = Object.keys(datos[0] || {});
        worksheet.addRow(header.map(col => col.toUpperCase())); // Agregar la fila de encabezado

        // Aplicar estilos al encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E4DFEC' } // Color de fondo #E4DFEC
            };
            cell.font = {
                bold: true,
                color: { argb: '000000' } // Color de texto negro
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            };
        });

        // Agregar datos y aplicar alineación centrada
        datos.forEach(row => {
            const newRow = worksheet.addRow(Object.values(row));

            // Aplicar alineación centrada a las celdas de la fila
            newRow.eachCell((cell) => {
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            });
        });

        // Ajustar el ancho de las columnas automáticamente
        worksheet.columns.forEach(column => {
            const maxLength = column.values.reduce((max, value) => Math.max(max, (value || '').toString().length), 0);
            column.width = maxLength + 2; // +2 para dar un poco de espacio extra
        });
        // Envía el archivo Excel
        res.setHeader('Content-Disposition', `attachment; filename=reportes_administracion_${genero || 'todos'}_${grado_academico || 'todos'}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res); // Escribir el archivo en la respuesta
        res.end(); // Finalizar la respuesta
    } catch (err) {
        console.error('Error al generar el Excel:', err.message);
        res.status(500).send('Error en el servidor');
    } finally {
        client.release();
    }
});
// Ruta para ver el formulario de candidatura limp
app.get('/formularioLimpieza', (req, res) => {
    res.sendFile(__dirname + '/public/formularioLimpieza.html');
});
// Ruta para ver el formulario de candidatura seg
app.get('/formularioSeguridad', (req, res) => {
    res.sendFile(__dirname + '/public/formularioSeguridad.html');
});
// Ruta para ver el formulario de candidatura adm
app.get('/formularioAdministracion', (req, res) => {
    res.sendFile(__dirname + '/public/formularioAdministracion.html');
});
// Ruta para la página de éxito
app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/views/success.html');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.get('/api/usuario-actual', (req, res) => {
    // Suponiendo que has almacenado la información del usuario en el objeto `req.user` después de la autenticación
    if (req.user) {
        res.json({ id_usuario: req.user.id_usuario, rol: req.user.rol });
    } else {
        res.status(401).json({ error: 'Usuario no autenticado' });
    }
});

app.post('/api/registrarUsuario', async (req, res) => {
    const { id_usuario, password, rol } = req.body;

    try {
        // Suponiendo que tienes una conexión configurada y tu tabla de usuarios en la base de datos
        const query = 'INSERT INTO USUARIO (ID_USUARIO, PASSWORD, ROL) VALUES ($1, $2, $3)';
        const values = [id_usuario, password, rol];

        await pool.query(query, values);
        res.json({ success: true });
    } catch (error) {
        console.error("Error al insertar usuario:", error);
        res.status(500).json({ success: false, message: "Error al registrar usuario" });
    }
});

// En tu archivo server.js o donde configuras las rutas
app.post('/api/iniciarSesion', async (req, res) => {
    const { id_usuario, password } = req.body;

    try {
        // Consultar la base de datos para ver si el usuario existe
        const query = 'SELECT * FROM USUARIO WHERE ID_USUARIO = $1';
        const values = [id_usuario];
        const result = await pool.query(query, values);

        if (result.rows.length > 0) {
            const usuario = result.rows[0];

            // Validación de contraseña (puedes ajustar esto según tu sistema de encriptación)
            if (usuario.password === password) {
                res.json({ success: true, rol: usuario.rol });
            } else {
                res.json({ success: false, message: "Contraseña incorrecta" });
            }
        } else {
            res.json({ success: false, message: "Usuario no existe" });
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});






