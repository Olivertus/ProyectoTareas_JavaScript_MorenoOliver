import { generateId } from "../utils/id-generator.js";
import { getCategories, getTasks, saveTasks } from "./storage-service.js";

function normalizeTitle(title) {
  return title.trim().toLowerCase();
}

function cleanDescription(description) {
  return typeof description === "string" ? description.trim() : "";
}

// Devuelve el id solo si la categoría existe; si no, null ("sin categoría")
function resolveCategoryId(categoryId) {
  if (typeof categoryId !== "string" || categoryId === "") {
    return null;
  }

  return getCategories().some((category) => category.id === categoryId) ? categoryId : null;
}

export function addTask({ title, description, completed = false, createdAt, categoryId } = {}) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";

  if (!cleanTitle) {
    return null;
  }

  const task = {
    id: generateId(),
    title: cleanTitle,
    description: cleanDescription(description),
    createdAt: createdAt ?? new Date().toISOString(),
    completed: Boolean(completed),
    imported: false,
    categoryId: resolveCategoryId(categoryId),
  };

  if (!saveTasks([...getTasks(), task])) {
    return null;
  }

  return task;
}

export function updateTask(id, changes = {}) {
  const tasks = getTasks();
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1 || tasks[index].imported) {
    return null;
  }

  const updated = { ...tasks[index] };

  if ("title" in changes) {
    const cleanTitle = String(changes.title).trim();

    if (!cleanTitle) {
      return null;
    }

    updated.title = cleanTitle;
  }

  if ("description" in changes) {
    updated.description = cleanDescription(changes.description);
  }

  if ("completed" in changes) {
    updated.completed = Boolean(changes.completed);
  }

  if ("categoryId" in changes) {
    updated.categoryId = resolveCategoryId(changes.categoryId);
  }

  tasks[index] = updated;

  if (!saveTasks(tasks)) {
    return null;
  }

  return updated;
}

export function deleteTask(id) {
  const tasks = getTasks();
  const remaining = tasks.filter((task) => task.id !== id);

  if (remaining.length === tasks.length) {
    return false;
  }

  return saveTasks(remaining);
}

export function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return null;
  }

  task.completed = !task.completed;

  if (!saveTasks(tasks)) {
    return null;
  }

  return task;
}

export function completeAll() {
  const tasks = getTasks().map((task) => ({ ...task, completed: true }));

  if (!saveTasks(tasks)) {
    return null;
  }

  return tasks;
}

export function clearAll() {
  return saveTasks([]) ? [] : null;
}

export function addImportedTasks(importedTasks, categoryId = null) {
  if (!Array.isArray(importedTasks)) {
    return [];
  }

  const current = getTasks();
  const knownTitles = new Set(
    current.filter((task) => task.imported).map((task) => normalizeTitle(task.title))
  );
  const toAdd = [];
  const validCategoryId = resolveCategoryId(categoryId);

  for (const task of importedTasks) {
    if (typeof task?.title !== "string") {
      continue;
    }

    const key = normalizeTitle(task.title);

    if (knownTitles.has(key)) {
      continue;
    }

    knownTitles.add(key);
    toAdd.push({ ...task, imported: true, categoryId: validCategoryId });
  }

  if (toAdd.length > 0 && !saveTasks([...current, ...toAdd])) {
    return null;
  }

  return toAdd;
}