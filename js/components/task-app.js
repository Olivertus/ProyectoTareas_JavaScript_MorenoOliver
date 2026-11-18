import "./task-list.js";
import "./task-form-modal.js";
import "./task-detail-modal.js";
import "./import-modal.js";
import "./category-modal.js";
import "./confirm-dialog.js";
import "./toast-message.js";
import { getCategories, getTasks } from "../services/storage-service.js";
import { addCategory, countTasksInCategory, deleteCategory, updateCategory } from "../services/category-service.js";
import { addImportedTasks, addTask, clearAll, deleteTask, toggleTask, updateTask } from "../services/task-service.js";

// <task-app> no dibuja nada: el HTML está en index.html y los estilos en css/app.css.
// Este componente solo conecta los botones y los eventos con los servicios.

// Pasa a minúsculas y quita las tildes: "Camión" -> "camion"
function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

class TaskApp extends HTMLElement {
  // Lista completa de tareas (viene del localStorage)
  #tasks = [];

  // Categorías disponibles (también vienen del localStorage)
  #categories = [];

  // Filtro por estado: "all" | "pending" | "completed"
  #filter = "all";

  // Filtro por categoría: "all" | "none" (sin categoría) | id de una categoría
  #categoryFilter = "all";

  // Texto del buscador
  #search = "";

  // Para conectar los eventos una sola vez
  #ready = false;

  connectedCallback() {
    if (!this.#ready) {
      this.#setup();
      this.#ready = true;
    }

    document.addEventListener("click", this.#onDocumentClick);
    this.#loadTasks();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
  }

  // Busca los elementos que están en index.html y conecta sus eventos
  #setup() {
    this.summary = this.querySelector(".summary");
    this.searchInput = this.querySelector(".search-input");
    this.addButton = this.querySelector(".add");
    this.importButton = this.querySelector(".import");
    this.categoriesButton = this.querySelector(".categories");
    this.filterButton = this.querySelector(".filter");
    this.filterMenu = this.querySelector(".filter-menu");
    this.filterOptions = this.querySelectorAll(".filter-option");
    this.categoryOptions = this.querySelector(".filter-categories-options");
    this.clearButton = this.querySelector(".clear");
    this.list = this.querySelector("task-list");
    this.formModal = this.querySelector("task-form-modal");
    this.detailModal = this.querySelector("task-detail-modal");
    this.importModal = this.querySelector("import-modal");
    this.categoryModal = this.querySelector("category-modal");
    this.confirmDialog = this.querySelector("confirm-dialog");
    this.toast = this.querySelector("toast-message");

    this.addButton.addEventListener("click", () => this.formModal.open());
    this.formModal.addEventListener("task-save", (event) => this.#onTaskSave(event));

    this.searchInput.addEventListener("input", () => {
      this.#search = this.searchInput.value;
      this.#render();
    });

    this.filterButton.addEventListener("click", () => this.#toggleFilterMenu());
    this.categoryOptions.addEventListener("click", (event) => {
      const option = event.target.closest(".filter-option");

      if (option) {
        this.#setCategoryFilter(option.dataset.category);
      }
    });
    this.filterOptions.forEach((option) => {
      option.addEventListener("click", () => this.#setFilter(option.dataset.filter));
    });
    this.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.filterMenu.hidden) {
        this.#closeFilterMenu();
        this.filterButton.focus();
      }
    });

    this.importButton.addEventListener("click", () => this.importModal.open());
    this.clearButton.addEventListener("click", () => this.#onClear());
    this.importModal.addEventListener("tasks-import", (event) => this.#onTasksImport(event));

    // Categorías: el botón abre el modal y sus eventos llegan hasta aquí
    this.categoriesButton.addEventListener("click", () => this.categoryModal.open());
    this.categoryModal.addEventListener("category-create", (event) => this.#onCategoryCreate(event));
    this.categoryModal.addEventListener("category-update", (event) => this.#onCategoryUpdate(event));
    this.categoryModal.addEventListener("category-delete", (event) => this.#onCategoryDelete(event));

    // Eventos que salen de cada <task-item> (burbujean hasta la lista)
    this.list.addEventListener("task-toggle", (event) => this.#onTaskToggle(event));
    this.detailModal.addEventListener("task-edit", (event) => this.#onTaskEdit(event));
    this.list.addEventListener("task-view", (event) => this.#onTaskView(event));
    this.list.addEventListener("task-edit", (event) => this.#onTaskEdit(event));
    this.list.addEventListener("task-delete", (event) => this.#onTaskDelete(event));
  }

  // Lee las tareas y las categorías guardadas y vuelve a dibujar
  #loadTasks() {
    this.#tasks = getTasks();
    this.#categories = getCategories();

    // Los selectores y el modal de categorías siempre reciben la lista actualizada
    this.formModal.categories = this.#categories;
    this.importModal.categories = this.#categories;
    this.categoryModal.categories = this.#categories;

    // Si se eliminó la categoría que estaba filtrada, se vuelve a mostrar todo
    const exists = this.#categories.some((category) => category.id === this.#categoryFilter);

    if (this.#categoryFilter !== "all" && this.#categoryFilter !== "none" && !exists) {
      this.#categoryFilter = "all";
    }

    this.#renderCategoryFilter();
    this.#render();
  }

  // Nombre de una categoría a partir de su id ("" si la tarea no tiene o ya no existe)
  #getCategoryName(categoryId) {
    return this.#categories.find((category) => category.id === categoryId)?.name ?? "";
  }

  // ---------- Popup del filtro ----------

  // Cierra el popup del filtro al hacer clic fuera de él
  #onDocumentClick = (event) => {
    const path = event.composedPath();

    if (!path.includes(this.filterMenu) && !path.includes(this.filterButton)) {
      this.#closeFilterMenu();
    }
  };

  #toggleFilterMenu() {
    if (this.filterMenu.hidden) {
      this.filterMenu.hidden = false;
      this.filterButton.setAttribute("aria-expanded", "true");

      // El foco pasa a la opción activa
      this.filterMenu.querySelector('[aria-checked="true"]').focus();
    } else {
      this.#closeFilterMenu();
    }
  }

  #closeFilterMenu() {
    this.filterMenu.hidden = true;
    this.filterButton.setAttribute("aria-expanded", "false");
  }

  // Elige un filtro, marca la opción activa y cierra el popup
  #setFilter(filter) {
    this.#filter = filter;

    this.filterOptions.forEach((option) => {
      option.setAttribute("aria-checked", String(option.dataset.filter === filter));
    });

    this.#closeFilterMenu();
    this.filterButton.focus();
    this.#render();
  }

  // Dibuja las opciones de categoría del menú: Todas, Sin categoría y cada categoría
  #renderCategoryFilter() {
    const choices = [
      { value: "all", label: "Todas las categorías" },
      { value: "none", label: "Sin categoría" },
      ...this.#categories.map((category) => ({ value: category.id, label: category.name })),
    ];

    const buttons = choices.map(({ value, label }) => {
      const button = document.createElement("button");

      button.className = "filter-option";
      button.type = "button";
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(value === this.#categoryFilter));
      button.dataset.category = value;
      button.textContent = label;

      return button;
    });

    this.categoryOptions.replaceChildren(...buttons);
  }

  // Elige una categoría para filtrar y cierra el popup
  #setCategoryFilter(value) {
    this.#categoryFilter = value;

    this.#renderCategoryFilter();
    this.#closeFilterMenu();
    this.filterButton.focus();
    this.#render();
  }

  // ---------- Acciones sobre las tareas ----------

  // Clic en una tarea: abre el popup con su información
  #onTaskView(event) {
    const task = this.#tasks.find((item) => item.id === event.detail.id);

    if (task) {
      this.detailModal.open({ task, categoryName: this.#getCategoryName(task.categoryId) });
    }
  }

  // Opción "Actualizar" de una tarea: abre el formulario con sus datos
  #onTaskEdit(event) {
    const task = this.#tasks.find((item) => item.id === event.detail.id);

    if (task) {
      this.formModal.open({ task });
    }
  }

  // Opción "Eliminar" de una tarea: pide confirmación antes de borrar
  async #onTaskDelete(event) {
    const task = this.#tasks.find((item) => item.id === event.detail.id);

    if (!task) {
      return;
    }

    const accepted = await this.confirmDialog.open({
      title: "Eliminar tarea",
      message: `¿Quieres eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
    });

    if (accepted) {
      if (deleteTask(task.id)) {
        this.toast.show("Tarea eliminada");
      } else {
        this.#showSaveError();
      }

      this.#loadTasks();
    }
  }

  // Botón "Vaciar": pide confirmación antes de borrar todo
  async #onClear() {
    const total = this.#tasks.length;

    // Si no hay tareas no hay nada que vaciar
    if (total === 0) {
      return;
    }

    const accepted = await this.confirmDialog.open({
      title: "Vaciar lista",
      message: `Se ${total === 1 ? "eliminará 1 tarea" : `eliminarán ${total} tareas`} de la lista. Esta acción no se puede deshacer.`,
      confirmText: "Vaciar",
    });

    if (accepted) {
      if (clearAll() === null) {
        this.#showSaveError();
      } else {
        this.toast.show("Lista vaciada");
      }

      this.#loadTasks();
    }
  }

  // ---------- Categorías ----------

  // Nueva categoría desde el modal de categorías
  #onCategoryCreate(event) {
    const { error } = addCategory(event.detail.name);

    if (error) {
      this.categoryModal.showError(error);
      return;
    }

    this.#loadTasks();
    this.categoryModal.reset("Categoría creada.");
  }

  // Renombrar una categoría
  #onCategoryUpdate(event) {
    const { id, name } = event.detail;
    const { error } = updateCategory(id, name);

    if (error) {
      this.categoryModal.showError(error);
      return;
    }

    this.#loadTasks();
    this.categoryModal.reset("Categoría actualizada.");
  }

  // Eliminar una categoría: pide confirmación y avisa cuántas tareas quedarán sin categoría
  async #onCategoryDelete(event) {
    const category = this.#categories.find((item) => item.id === event.detail.id);

    if (!category) {
      return;
    }

    const used = countTasksInCategory(category.id);
    const consequence =
      used === 0
        ? "Esta acción no se puede deshacer."
        : `${used === 1 ? "La tarea que la usa quedará" : `Las ${used} tareas que la usan quedarán`} sin categoría. Esta acción no se puede deshacer.`;

    const accepted = await this.confirmDialog.open({
      title: "Eliminar categoría",
      message: `¿Quieres eliminar la categoría "${category.name}"? ${consequence}`,
      confirmText: "Eliminar",
    });

    if (!accepted) {
      return;
    }

    const deleted = deleteCategory(category.id);

    this.#loadTasks();

    if (deleted) {
      this.categoryModal.notify("Categoría eliminada.");
    } else {
      this.categoryModal.showError("No se pudo eliminar. Revisa que el navegador permita guardar datos.");
    }
  }

  // Tareas elegidas en el modal de importar (los repetidos se descartan solos)
  #onTasksImport(event) {
    const added = addImportedTasks(event.detail.tasks, event.detail.categoryId);

    this.#loadTasks();

    if (added === null) {
      this.#showSaveError();
    } else if (added.length === 0) {
      this.toast.show("Esas tareas ya estaban importadas");
    } else {
      const text = added.length === 1 ? "1 tarea importada" : `${added.length} tareas importadas`;
      this.toast.show(text);
    }
  }

  // Guardar desde el formulario: con id actualiza, sin id crea
  #onTaskSave(event) {
    const { id, title, description, createdAt, completed, categoryId } = event.detail;

    if (id) {
      const updated = updateTask(id, { title, description, completed, categoryId });

      if (updated) {
        this.toast.show("Tarea actualizada");
      } else {
        this.#showSaveError();
      }
    } else {
      const created = addTask({ title, description, createdAt, completed, categoryId });

      if (created) {
        this.toast.show("Tarea creada");
      } else {
        this.#showSaveError();
      }
    }

    this.#loadTasks();
  }

  // Clic en el círculo de una tarea: cambia pendiente <-> terminada
  #onTaskToggle(event) {
    if (!toggleTask(event.detail.id)) {
      this.#showSaveError();
    }

    this.#loadTasks();
  }

  // Aviso cuando el navegador no deja guardar (almacenamiento lleno o desactivado)
  #showSaveError() {
    this.toast.show(
      "No se pudo guardar. Revisa que el navegador permita guardar datos y tenga espacio.",
      "error"
    );
  }

  // ---------- Dibujar la pantalla ----------

  // Dibuja la pantalla con el estado actual
  #render() {
    const visible = this.#getVisibleTasks();

    // "Sin resultados" solo si hay tareas pero el filtro o la búsqueda las ocultan todas
    const hasFilters =
      this.#filter !== "all" || this.#categoryFilter !== "all" || this.#search.trim() !== "";

    this.list.filtered = hasFilters && this.#tasks.length > 0;
    this.list.categories = this.#categories;
    this.list.tasks = visible;

    this.#renderSummary();
  }

  // Resumen con el total de tareas (sin importar el filtro): "5 tareas · 2 completadas"
  #renderSummary() {
    const total = this.#tasks.length;
    const done = this.#tasks.filter((task) => task.completed).length;

    const totalText = total === 1 ? "1 tarea" : `${total} tareas`;
    const doneText = done === 1 ? "1 completada" : `${done} completadas`;

    const text = `${totalText} · ${doneText}`;

    // Solo se actualiza si cambió, para que el lector de pantalla no repita el aviso
    if (this.summary.textContent !== text) {
      this.summary.textContent = text;
    }
  }

  // Aplica el filtro por estado, el de categoría y después la búsqueda
  #getVisibleTasks() {
    let tasks = this.#tasks;

    if (this.#filter === "pending") {
      tasks = tasks.filter((task) => !task.completed);
    } else if (this.#filter === "completed") {
      tasks = tasks.filter((task) => task.completed);
    }

    if (this.#categoryFilter === "none") {
      tasks = tasks.filter((task) => !task.categoryId);
    } else if (this.#categoryFilter !== "all") {
      tasks = tasks.filter((task) => task.categoryId === this.#categoryFilter);
    }

    const text = normalize(this.#search.trim());

    if (text !== "") {
      tasks = tasks.filter((task) => normalize(task.title).includes(text));
    }

    return tasks;
  }
}

if (!customElements.get("task-app")) {
  customElements.define("task-app", TaskApp);
}
