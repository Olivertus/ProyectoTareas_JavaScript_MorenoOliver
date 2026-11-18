/**

ESTÁNDAR DE ID

Formato: "task-" + timestamp en base 36 + "-" + sufijo aleatorio en base 36
Ejemplo: task-mh4k7q2z-9f3a

- El prefijo "task-" identifica el tipo de dato.
- El timestamp (Date.now()) hace que los IDs sean únicos en el tiempo.
- El sufijo aleatorio evita choques si dos IDs se crean en el mismo milisegundo.
 */

// El prefijo permite reutilizar el estándar para otros datos: "task" (tareas) o "cat" (categorías)
export function generateId(prefix = "task") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6).padEnd(4, "0");

  return `${prefix}-${timestamp}-${random}`;
}