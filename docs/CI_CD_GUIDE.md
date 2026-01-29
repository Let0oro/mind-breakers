# Guía de CI/CD, Husky y Buenas Prácticas

Esta documentación explica las implementaciones realizadas en el proyecto para asegurar la calidad del código, la consistencia en los commits y la automatización de pruebas mediante Integración Continua (CI).

## 1. Integración Continua (CI) con GitHub Actions

### ¿Qué es CI/CD?
- **CI (Continuous Integration)**: Práctica de automatizar la integración de cambios de código de múltiples colaboradores en un solo proyecto de software. Implica ejecutar pruebas automatizadas (tests, linter) para detectar errores rápidamente.
- **CD (Continuous Delivery/Deployment)**: Práctica de automatizar la entrega de las aplicaciones a los entornos de infraestructura seleccionados.

### Implementación en este proyecto
Hemos creado un flujo de trabajo (workflow) en `.github/workflows/ci.yml`.

**¿Qué hace este workflow?**
Cada vez que subes cambios (`push`) a `main` o creas un `pull request`:
1. **Checkout**: Descarga tu código en un servidor virtual de GitHub.
2. **Setup Node**: Instala Node.js v20.
3. **Install**: Instala las dependencias de forma limpia (`npm ci`).
4. **Lint**: Revisa que el código cumpla las reglas de estilo (`npm run lint`).
5. **Test**: Ejecuta los tests automatizados (`npm run test`).
6. **Build**: Intenta construir la aplicación para asegurar que no hay errores de compilación (`npm run build`).

Si cualquiera de estos pasos falla, GitHub marcará el commit como fallido y te avisará.

---

## 2. Husky y Git Hooks

### ¿Qué son los Git Hooks?
Son scripts que Git ejecuta antes o después de eventos como `commit`, `push`, etc.

### ¿Qué hace Husky?
Husky facilita la configuración de estos hooks en proyectos de Node.js, asegurando que todos los desarrolladores del equipo tengan las mismas validaciones.

### Hooks configurados
1. **Pre-commit (`.husky/pre-commit`)**:
   - Se ejecuta **antes** de que se cree el commit.
   - Ejecuta `lint-staged`.
   
2. **Commit-msg (`.husky/commit-msg`)**:
   - Se ejecuta para validar el **mensaje** del commit.
   - Usa `commitlint` para asegurar que el mensaje sigue una convención estándar.

---

## 3. Lint Staged

`lint-staged` nos permite ejecutar scripts (como el linter) **solo en los archivos que han cambiado** (staged) y no en todo el proyecto. Esto hace que los commits sean mucho más rápidos.

**Configuración en `package.json`**:
```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix"
  ]
}
```
Esto intenta arreglar automáticamente errores de linter en archivos JS/TS antes de permitir el commit.

---

## 4. Conventional Commits (Buenas Prácticas)

Hemos configurado `commitlint` para forzar el uso de **Conventional Commits**. Esto estandariza cómo escribimos los mensajes de commit, haciéndolos legibles para humanos y máquinas (útil para generar changelogs automáticos).

### Estructura obligatoria
```
<tipo>: <descripción breve>

[cuerpo opcional]

[pie opcional]
```

### Tipos comunes
- `feat`: Una nueva característica (feature).
- `fix`: Una corrección de un bug.
- `docs`: Cambios solo en documentación.
- `style`: Cambios que no afectan el significado del código (espacios, formato).
- `refactor`: Cambio de código que no arregla un bug ni añade una funcionalidad.
- `perf`: Cambio que mejora el rendimiento.
- `test`: Añadir tests faltantes o corregir existentes.
- `chore`: Cambios en el proceso de build o herramientas auxiliares.

### Ejemplos
- ✅ `feat: add dark mode support`
- ✅ `fix: resolve login bug on mobile`
- ✅ `docs: update readme instructions`
- ❌ `arreglado el login` (Falta el tipo)
- ❌ `feat: Add Dark Mode` (Se recomienda minúsculas en la descripción por convención, aunque configurable)

Si intentas hacer un commit con un mensaje incorrecto, Husky lo bloqueará y te mostrará el error.

---

## Resumen de Comandos Útiles

- `npm run lint`: Ejecuta el linter manualmente.
- `npm run test`: Ejecuta los tests con Vitest.
- `git commit -m "feat: message"`: Forma correcta de hacer commit.
