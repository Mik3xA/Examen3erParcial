#  Gatekeeper System

**Examen Práctico Integrador | Ingeniería en Sistemas Computacionales 2026**

Gatekeeper es una plataforma automatizada para gestionar el acceso a contenido restringido (Gafete Digital). Utiliza el stack **PERN** (PostgreSQL, Express, React, Node.js) orquestado con automatización a través de **n8n**. 

El sistema permite a los usuarios con correo institucional (`@itses.edu.mx`) ingresar un folio de pago. El backend recibe la solicitud, dispara un flujo en n8n que valida el folio en la base de datos (Neon) y, si es correcto, aprueba el acceso, liberando el contenido en tiempo real mediante *Polling* y enviando una confirmación por correo electrónico (Gmail OAuth2).

---

##  Tecnologías Utilizadas

* **Frontend:** React.js, CSS nativo, Axios.
* **Backend:** Node.js, Express.js, Cors.
* **Base de Datos:** PostgreSQL (Alojado en Neon.tech), librería `pg`.
* **Automatización:** n8n (Local).
* **Notificaciones:** API nativa de Gmail vía OAuth2.

---

##  Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada).
- Cuenta en [Neon.tech](https://neon.tech/) para la base de datos PostgreSQL.
- Cuenta de Google/Gmail configurada con credenciales OAuth2.

---

##  Guía de Instalación Paso a Paso

### 1. Configuración de la Base de Datos (PostgreSQL en Neon)
1. Ejecuta el archivo `script_database.sql` incluido en la raíz de este repositorio dentro de tu consola SQL en Neon.tech.
2. Esto creará las tablas `pagos_referencia` y `solicitudes`, e insertará los folios de prueba.
3. Copia tu cadena de conexión (Connection String) proporcionada por Neon.

### 2. Configuración del Backend (API Node.js)
Abre una terminal y ejecuta los siguientes comandos:

```bash
# 1. Entra a la carpeta del backend
cd backend

# 2. Instala las dependencias necesarias
npm install express pg cors dotenv axios

# 3. Crea el archivo de variables de entorno (OBLIGATORIO)
touch .env
