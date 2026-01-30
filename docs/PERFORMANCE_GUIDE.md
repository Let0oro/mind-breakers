# Guía de Rendimiento y Optimización

Esta documentación explica las herramientas implementadas para medir y optimizar el rendimiento de la aplicación, asegurando una experiencia de usuario rápida y fluida.

## 1. Next.js Bundle Analyzer

### ¿Qué es?
Es una herramienta que te permite **visualizar el tamaño** de los archivos generados por tu aplicación (bundles). Muestra un mapa interactivo donde cada rectángulo representa un módulo o dependencia; cuanto más grande el rectángulo, más pesado es el archivo.

### ¿Para qué sirve?
- Identificar dependencias (librerías) "gigantes" que quizás no son necesarias.
- Entender qué parte de tu código ocupa más espacio.
- Optimizar el tiempo de carga inicial reduciendo el tamaño del JavaScript que se envía al navegador.

### ¿Cómo usarlo?
Para ver el reporte, ejecuta el siguiente comando en tu terminal:

```bash
ANALYZE=true npm run build
```

Esto abrirá automáticamente dos pestañas en tu navegador:
1. **client.html**: Análisis del código que se descarga en el navegador del usuario.
2. **server.html**: Análisis del código que se ejecuta en el servidor.

---

## 2. Lighthouse CI

### ¿Qué es?
Lighthouse es una herramienta de código abierto de Google que audita la calidad de las páginas web. Evalúa:
- **Rendimiento (Performance)**: Velocidad de carga.
- **Accesibilidad**: Si la web es usable por personas con discapacidades.
- **Buenas Prácticas**: Seguridad y estándares modernos.
- **SEO**: Optimización para buscadores.
- **PWA**: Si cumple estándares de Progressive Web App.

### Implementación Automatizada (CI)
Hemos integrado Lighthouse en el flujo de trabajo de GitHub Actions. Cada vez que subes cambios:
1. Se construye el proyecto.
2. Se inicia un servidor local.
3. Lighthouse "navega" tu sitio automáticamente y genera reportes.

**Configuración (`lighthouserc.js`):**
El archivo de configuración define cómo corre Lighthouse. Actualmente está configurado para:
- Ejecutar 3 pasadas (para obtener un promedio fiable).
- Auditar la página de inicio (y otras configuradas).
- Subir los reportes a un almacenamiento temporal público (visualizable desde los logs de GitHub).

### Ejecución Local
También puedes ejecutar Lighthouse CI en tu máquina sin subir cambios:

1. Construye el proyecto: `npm run build`
2. Ejecuta la auditoría: `npx lhci autorun`

---

## Resumen de Comandos

- `ANALYZE=true npm run build`: Genera el mapa de tamaño de dependencias.
- `npx lhci autorun`: Ejecuta la auditoría de Lighthouse en local (requiere build previo).
