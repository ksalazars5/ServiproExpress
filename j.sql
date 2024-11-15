SELECT * FROM public.datos_generales
ORDER BY id_pregunta ASC 

CREATE TABLE DATOS_GENERALES (
    ID_PREGUNTA SERIAL PRIMARY KEY,  -- SERIAL se convierte en un tipo entero con autoincremento
    NOMBRES VARCHAR(50),
    APELLIDOS VARCHAR(50),
    TEL1 VARCHAR(15),
    TEL2 VARCHAR(15),
    CORREO VARCHAR(50),
    DIRECCION VARCHAR(50),
    EDAD INT,
    DPI VARCHAR(50),
    ESTADO_CIVIL VARCHAR(30),
    GENERO CHAR(1),
    ID_RECLUTAMIENTO INT,  -- Asegúrate de incluir la columna ID_RECLUTAMIENTO
    FOREIGN KEY (ID_RECLUTAMIENTO) REFERENCES RECLUTAMIENTO(ID_RECLUTAMIENTO)  -- Establece la clave foránea
);
