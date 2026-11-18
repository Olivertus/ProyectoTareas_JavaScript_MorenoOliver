import { generateId } from "../utils/id-generator.js";
import { getCategories, getTasks, saveCategories, saveTasks } from "./storage-service.js";

const MAX_NAME_LENGTH = 30;

// Pasa a minúsculas y quita las tildes para comparar nombres: "Camión" -> "camion"
function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

// Revisa el nombre y devuelve un texto de error, o null si está bien.
// excludeId permite ignorar la propia categoría al renombrarla.
function validateName(name, categories, excludeId = null) {
  const clean = typeof name === "string" ? name.trim() : "";

  if (!clean) {
    return "El nombre de la categoría es obligatorio.";
  }

  if (clean.length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres.`;
  }

  const repeated = categories.some(
    (category) => category.id !== excludeId && normalizeName(category.name) === normalizeName(clean)
  );

  return repeated ? "Ya existe una categoría con ese nombre." : null;
}

// Las funciones devuelven { category } si todo sale bien, o { error } con un
// mensaje listo para mostrarle al usuario.

export function addCategory(name) {
  const categories = getCategories();
  const error = validateName(name, categories);

  if (error) {
    return { error };
  }

  const category = {
    id: generateId("cat"),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!saveCategories([...categories, category])) {
    return { error: "No se pudo guardar la categoría." };
  }

  return { category };
}

export function updateCategory(id, name) {
  const categories = getCategories();
  const index = categories.findIndex((category) => category.id === id);

  if (index === -1) {
    return { error: "La categoría ya no existe." };
  }

  const error = validateName(name, categories, id);

  if (error) {
    return { error };
  }

  const category = { ...categories[index], name: name.trim() };
  categories[index] = category;

  if (!saveCategories(categories)) {
    return { error: "No se pudo guardar la categoría." };
  }

  return { category };
}

// Elimina la categoría y deja "sin categoría" a las tareas que la usaban.
// Devuelve true / false.
export function deleteCategory(id) {
  const categories = getCategories();
  const remaining = categories.filter((category) => category.id !== id);

  if (remaining.length === categories.length) {
    return false;
  }

  const tasks = getTasks();
  const hasAffected = tasks.some((task) => task.categoryId === id);

  // Primero se sueltan las tareas; así nunca queda una tarea apuntando a una categoría borrada
  if (hasAffected) {
    const released = tasks.map((task) => (task.categoryId === id ? { ...task, categoryId: null } : task));

    if (!saveTasks(released)) {
      return false;
    }
  }

  return saveCategories(remaining);
}

// Cuántas tareas usan la categoría (para avisar antes de eliminarla)
export function countTasksInCategory(id) {
  return getTasks().filter((task) => task.categoryId === id).length;
}
