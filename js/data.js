export const questions = [
    // Level 1: Conceptos Básicos (1-10)
    {
        level: 1,
        question: "Objetivo principal de la Arquitectura Empresarial:",
        options: ["Ahorrar costos", "Alinear Negocio y TI", "Crear redes", "Gestionar proyectos"],
        answer: 1 // Index of correct answer
    },
    {
        level: 1,
        question: "¿Qué representa la arquitectura 'AS-IS'?",
        options: ["Estado Futuro", "Estado Ideal", "Estado Actual", "Estado Pasado"],
        answer: 2
    },
    {
        level: 1,
        question: "¿Qué representa la arquitectura 'TO-BE'?",
        options: ["Estado Actual", "Estado Futuro", "Competencia", "Histórico"],
        answer: 1
    },
    {
        level: 1,
        question: "Definición de 'Empresa' en AE:",
        options: ["Solo compañías S.A.", "Org. con metas comunes", "Departamento de TI", "Edificio corporativo"],
        answer: 1
    },
    {
        level: 1,
        question: "NO es un dominio de AE:",
        options: ["Negocio", "Datos", "Marketing", "Aplicaciones"],
        answer: 2
    },
    {
        level: 1,
        question: "Significado de TOGAF:",
        options: ["Open Group Framework", "Total Org Framework", "Tech Ops Group", "Global Tech Arch"],
        answer: 0
    },
    {
        level: 1,
        question: "Núcleo central de TOGAF:",
        options: ["Zachman", "ADM (Método)", "Cubo TI", "UML"],
        answer: 1
    },
    {
        level: 1,
        question: "Dimensiones de la Matriz de Zachman:",
        options: ["3x3", "4x4", "6x6", "8x8"],
        answer: 2
    },
    {
        level: 1,
        question: "Las columnas de Zachman responden a:",
        options: ["Sí / No", "Qué, Cómo, Quién...", "Entrada / Salida", "Planear / Hacer"],
        answer: 1
    },
    {
        level: 1,
        question: "Fase del ADM para el alcance y visión:",
        options: ["Preliminar", "Fase A", "Fase B", "Fase H"],
        answer: 1
    },

    // Level 2: Dominios y Herramientas (11-20)
    {
        level: 2,
        question: "La Arquitectura de Negocio define:",
        options: ["Bases de datos", "Estrategia y Procesos", "Hardware", "Código fuente"],
        answer: 1
    },
    {
        level: 2,
        question: "La Arquitectura de Aplicaciones define:",
        options: ["Servidores", "Organigrama", "Sistemas e interacciones", "Cables de red"],
        answer: 2
    },
    {
        level: 2,
        question: "La Arquitectura de Datos define:",
        options: ["Velocidad de internet", "Estructura de la información", "Licencias de software", "Pantallas de usuario"],
        answer: 1
    },
    {
        level: 2,
        question: "La Arquitectura Tecnológica define:",
        options: ["Hardware y Software base", "Nómina de empleados", "Marketing digital", "Ventas anuales"],
        answer: 0
    },
    {
        level: 2,
        question: "¿Qué es el 'Gap Analysis'?",
        options: ["Análisis de Brechas", "Análisis de Costos", "Auditoría financiera", "Medición de redes"],
        answer: 0
    },
    {
        level: 2,
        question: "¿Qué es un 'Stakeholder'?",
        options: ["Accionista mayoritario", "Interesado en el proyecto", "Proveedor de nubes", "Hacker ético"],
        answer: 1
    },
    {
        level: 2,
        question: "Una 'Vista' (View) es:",
        options: ["Foto del servidor", "Perspectiva de un interesado", "Resumen ejecutivo", "Base de datos"],
        answer: 1
    },
    {
        level: 2,
        question: "Un 'Punto de Vista' (Viewpoint) define:",
        options: ["Opinión personal", "Convenciones de la vista", "Lugar de reunión", "Tipo de hardware"],
        answer: 1
    },
    {
        level: 2,
        question: "Lenguaje estándar de modelado en AE:",
        options: ["Java", "Python", "ArchiMate", "HTML5"],
        answer: 2
    },
    {
        level: 2,
        question: "Significado de SOA:",
        options: ["Sistema de Admin", "Arq. Orientada a Servicios", "Análisis de Operaciones", "Acceso Seguro"],
        answer: 1
    },

    // Level 3: Gobernanza y Situacional (21-30)
    {
        level: 3,
        question: "Fin del Gobierno de Arquitectura:",
        options: ["Reducir personal", "Asegurar cumplimiento", "Comprar equipos", "Programar código"],
        answer: 1
    },
    {
        level: 3,
        question: "¿Qué es un 'Building Block'?",
        options: ["Ladrillo", "Componente reutilizable", "Error de sistema", "Oficina nueva"],
        answer: 1
    },
    {
        level: 3,
        question: "Documento que inicia el ciclo ADM:",
        options: ["Factura", "Solicitud de Trabajo", "Diagrama de red", "Contrato laboral"],
        answer: 1
    },
    {
        level: 3,
        question: "El Continuum Empresarial es:",
        options: ["Repositorio de activos", "Historia de la empresa", "Plan de respaldo", "Lista de empleados"],
        answer: 0
    },
    {
        level: 3,
        question: "Un 'Principio de Arquitectura' es:",
        options: ["Una ley estatal", "Regla/Directriz general", "Deseo del jefe", "Clave de acceso"],
        answer: 1
    },
    {
        level: 3,
        question: "Procesos duplicados indican fallas en:",
        options: ["Arq. Tecnológica", "Arq. de Negocio", "Arq. de Seguridad", "Arq. Física"],
        answer: 1
    },
    {
        level: 3,
        question: "Interoperabilidad significa:",
        options: ["Operar solo", "Trabajar juntos", "Procesar rápido", "Almacenar mucho"],
        answer: 1
    },
    {
        level: 3,
        question: "Siglas de 'Modelo de Referencia Técnica':",
        options: ["MRT", "TRM", "RTM", "MTR"],
        answer: 1
    },
    {
        level: 3,
        question: "Beneficio de reutilizar bloques:",
        options: ["Más complejidad", "Consistencia y Ahorro", "Lentitud", "Más hardware"],
        answer: 1
    },
    {
        level: 3,
        question: "Diferencia Arq. Empresarial vs Solución:",
        options: ["Salario", "Estrategia vs Proyecto", "Ninguna", "Saber programar"],
        answer: 1
    }
];
