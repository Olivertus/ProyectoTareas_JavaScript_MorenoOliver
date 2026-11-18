const STORAGE_KEY = "tasks";
const CATEGORIES_KEY = "categories";

// Una tarea válida es un objeto con id y title de tipo texto
function isValidTask(task) {
  return (
    typeof task === "object" &&
    task !== null &&
    typeof task.id === "string" &&
    typeof task.title === "string"
  );
}

// Una categoría válida es un objeto con id y name de tipo texto
function isValidCategory(category) {
  return (
    typeof category === "object" &&
    category !== null &&
    typeof category.id === "string" &&
    typeof category.name === "string"
  );
}

// Lee una lista JSON del localStorage y descarta lo que no pase la validación
function readList(key, isValid) {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);

    // Si la lista trae elementos dañados, se descartan en vez de romper la app
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch (error) {
    console.error(`No se pudo leer "${key}" del almacenamiento:`, error);
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error(`No se pudo guardar "${key}" en el almacenamiento:`, error);
    return false;
  }
}

export function getTasks() {
  return readList(STORAGE_KEY, isValidTask);
}

export function saveTasks(tasks) {
  return writeList(STORAGE_KEY, tasks);
}

export function getCategories() {
  return readList(CATEGORIES_KEY, isValidCategory);
}

export function saveCategories(categories) {
  return writeList(CATEGORIES_KEY, categories);
}
