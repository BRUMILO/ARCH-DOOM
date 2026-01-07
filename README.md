# ARCH-DOOM 🔫👾

**ARCH-DOOM** es un desafío de **Arquitectura Empresarial** estilo FPS (First Person Shooter) inspirado en el clásico Doom. El objetivo del juego es infiltrarse en el sistema, recuperar datos y demostrar tus conocimientos sobre conceptos de AE (TOGAF, Zachman, etc.) para avanzar.

## 📋 Características

* **Juego de Disparos en Primera Persona**: Muévete por laberintos 3D, dispara a enemigos y esquiva ataques.
* **Aprendizaje Gamificado**: Para abrir puertas y desactivar bloqueos de seguridad, debes responder correctamente preguntas de Arquitectura Empresarial.
* **3 Niveles de Dificultad**:
  * **Nivel 1**: Conceptos Básicos (Introducción a AE, TOGAF, Zachman).
  * **Nivel 2**: Dominios y Herramientas (Arquitecturas de Negocio, Datos, Aplicaciones, Tecnológica).
  * **Nivel 3**: Gobernanza y Situacional (Gobierno, Building Blocks, ADM, Interoperabilidad).
* **HUD Interactivo**: Monitoriza tu Salud, Escudo, Bajas (Kills) y Objetivos cumplidos.
* **Estética Retro/Arcade**: Gráficos y fuentes estilo neón y pixel art.

## 🎮 Controles

| Acción         | Tecla / Input      |
| :------------- | :----------------- |
| **Movimiento** | `W`, `A`, `S`, `D` |
| **Cámara**     | `Mouse`            |
| **Disparar**   | `Clic Izquierdo`   |
| **Pausa**      | `ESC`              |

## 🛠️ Tecnologías

* **HTML5 / CSS3**: Estructura y estilos (diseño responsivo, animaciones CSS).
* **JavaScript (ES6+)**: Lógica del juego.
* **Three.js**: Motor de renderizado 3D.
* **Web Audio API**: Generación y control de efectos de sonido en tiempo real.

## 📂 Estructura del Proyecto

* `index.html`: Punto de entrada principal. Contiene la UI y la estructura del lienzo.
* `css/`: Hojas de estilo para la interfaz y el juego.
* `js/`:
  * `main.js`: Punto de entrada principal. Inicializa el motor, el bucle de juego y coordina los componentes.
  * `engine.js`: Configuración de Three.js (Escena, Cámara, Renderer, Iluminación).
  * `level.js`: Generación procedimental de niveles (muros, triggers) basado en mapas de bits.
  * `player.js`: Controlador del jugador (Movimiento FPS, físicas, colisiones, salud/escudo).
  * `weapon.js`: Lógica de armas, raycasting para disparos y efectos visuales.
  * `enemy.js`: IA de enemigos, máquinas de estado (Patrulla/Persecución) y renderizado de drones.
  * `quiz.js`: Lógica del sistema de preguntas, interfaz de usuario del quiz y validación de respuestas.
  * `minimap.js`: Renderizado del mapa 2D en tiempo real (Canvas API).
  * `sound_manager.js`: sintetizador de audio en tiempo real usando Web Audio API.
  * `data.js`: Base de datos de preguntas y respuestas para los 3 niveles.
* `assets/`: Imágenes.
