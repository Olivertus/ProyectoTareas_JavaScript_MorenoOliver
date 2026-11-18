const template = document.createElement("template");

template.innerHTML = `
  <style>
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :host {
      --modal-padding: var(--space-4);
    }

    @media (min-width: 480px) {
      :host {
        --modal-padding: var(--space-6);
      }
    }

    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    [hidden] {
      display: none !important;
    }

    dialog {
      width: min(560px, calc(100vw - 2rem));
      max-height: min(80vh, 640px);
      padding: 0;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
    }

    dialog::backdrop {
      background: var(--color-overlay, rgba(0, 0, 0, 0.65));
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) var(--modal-padding);
      border-bottom: 1px solid var(--color-border);
    }

    .header h2 {
      margin: 0;
      font-size: var(--font-size-lg);
    }

    .close {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
    }

    .close:hover {
      background: var(--color-surface-raised);
      color: var(--color-text);
    }

    .body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: var(--space-4) var(--modal-padding);
    }

    .field {
      display: grid;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .field label {
      font-size: var(--font-size-sm);
      font-weight: 500;
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    input[type="text"] {
      width: 100%;
      height: 42px;
      padding: 9px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-surface-raised);
      color: var(--color-text);
      font: inherit;
      font-size: var(--font-size-button);
    }

    input[aria-invalid="true"] {
      border-color: var(--color-danger);
    }

    .error {
      margin: 0;
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }

    .btn {
      height: 42px;
      padding: 9px 12px;
      border: none;
      border-radius: var(--radius-button);
      background: var(--color-control);
      color: var(--color-text);
      font-size: var(--font-size-button);
    }

    .btn:hover {
      filter: brightness(1.2);
    }

    .btn.primary {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .actions {
      display: flex;
      gap: var(--space-2);
    }

    .actions .btn {
      flex: 1;
    }

    .list {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-row);
    }

    .item.editing {
      border-color: var(--color-primary);
    }

    .name {
      flex: 1;
      min-width: 0;
      font-size: var(--font-size-sm);
      overflow-wrap: anywhere;
    }

    .item-actions {
      display: flex;
      flex: none;
      gap: var(--space-1);
    }

    .small {
      height: 32px;
      padding: 0 var(--space-3);
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .small:hover {
      background: var(--color-surface-raised);
      color: var(--color-text);
    }

    .small.danger:hover {
      color: var(--color-danger);
    }

    .status {
      margin: 0 0 var(--space-3);
      color: var(--color-success);
      font-size: var(--font-size-sm);
    }

    .empty {
      margin: 0;
      padding: var(--space-6) var(--space-4);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-align: center;
    }

    @media (min-width: 480px) {
      .form-row {
        flex-direction: row;
      }

      .actions .btn {
        flex: none;
      }
    }
  </style>

  <dialog aria-labelledby="modal-title">
    <header class="header">
      <h2 id="modal-title">Categorías</h2>
      <button class="close" type="button" aria-label="Cerrar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>
    </header>

    <div class="body">
      <form class="field" novalidate>
        <label for="category-name">Nueva categoría</label>

        <div class="form-row">
          <input id="category-name" type="text" maxlength="30" autocomplete="off" placeholder="Ej: Trabajo, Estudio, Casa" aria-describedby="category-error">

          <div class="actions">
            <button class="btn primary save" type="submit">Agregar</button>
            <button class="btn cancel-edit" type="button" hidden>Cancelar</button>
          </div>
        </div>

        <p class="error" id="category-error" role="alert" hidden></p>
      </form>

      <p class="status" role="status" hidden></p>

      <ul class="list" aria-label="Categorías creadas"></ul>
      <p class="empty" role="status" hidden>Aún no hay categorías. Crea la primera arriba.</p>
    </div>
  </dialog>
`;

class CategoryModal extends HTMLElement {
  #categories = [];

  // Id de la categoría que se está renombrando. null = modo agregar
  #editingId = null;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(template.content.cloneNode(true));

    const root = this.shadowRoot;
    this.dialog = root.querySelector("dialog");
    this.form = root.querySelector("form");
    this.input = root.querySelector("#category-name");
    this.errorEl = root.querySelector("#category-error");
    this.statusEl = root.querySelector(".status");
    this.saveButton = root.querySelector(".save");
    this.cancelEditButton = root.querySelector(".cancel-edit");
    this.listEl = root.querySelector(".list");
    this.emptyEl = root.querySelector(".empty");

    root.querySelector(".close").addEventListener("click", () => this.close());
    this.cancelEditButton.addEventListener("click", () => this.#stopEditing());

    // Clic en el fondo (el <dialog> no tiene padding) cierra el modal
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) {
        this.close();
      }
    });

    this.dialog.addEventListener("close", () => this.#stopEditing());

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#submit();
    });
    this.input.addEventListener("input", () => {
      this.#clearError();
      this.notify("");
    });

    // Editar y eliminar: un solo listener para toda la lista
    this.listEl.addEventListener("click", (event) => this.#onListClick(event));

    this.#render();
  }

  get categories() {
    return this.#categories;
  }

  set categories(value) {
    this.#categories = Array.isArray(value) ? value : [];

    // Si la categoría que se editaba ya no existe, se sale del modo editar
    if (this.#editingId && !this.#categories.some((category) => category.id === this.#editingId)) {
      this.#stopEditing();
    }

    this.#render();
  }

  open() {
    if (this.dialog.open) {
      return;
    }

    this.#stopEditing();
    this.notify("");
    this.dialog.showModal();
    this.input.focus();
  }

  close() {
    this.dialog.close();
  }

  // Lo llama <task-app> cuando el servicio rechaza el nombre (vacío, repetido...)
  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
    this.input.setAttribute("aria-invalid", "true");
    this.input.focus();
  }

  // Lo llama <task-app> cuando la operación salió bien: limpia el formulario
  // y muestra un mensaje breve (el aviso global queda tapado por el modal)
  reset(message = "") {
    this.#stopEditing();
    this.notify(message);
    this.input.focus();
  }

  // Mensaje de éxito dentro del modal
  notify(message) {
    this.statusEl.textContent = message;
    this.statusEl.hidden = message === "";
  }

  #clearError() {
    this.errorEl.textContent = "";
    this.errorEl.hidden = true;
    this.input.removeAttribute("aria-invalid");
  }

  #startEditing(category) {
    this.#editingId = category.id;
    this.input.value = category.name;
    this.saveButton.textContent = "Guardar";
    this.cancelEditButton.hidden = false;
    this.#clearError();
    this.#render();
    this.input.focus();
    this.input.select();
  }

  #stopEditing() {
    this.#editingId = null;
    this.input.value = "";
    this.saveButton.textContent = "Agregar";
    this.cancelEditButton.hidden = true;
    this.#clearError();
    this.#render();
  }

  #submit() {
    const name = this.input.value.trim();

    if (name === "") {
      this.showError("El nombre de la categoría es obligatorio.");
      return;
    }

    // Con id se renombra; sin id se crea
    const detail = this.#editingId ? { id: this.#editingId, name } : { name };
    const eventName = this.#editingId ? "category-update" : "category-create";

    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
  }

  #onListClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const category = this.#categories.find((item) => item.id === button.dataset.id);

    if (!category) {
      return;
    }

    if (button.dataset.action === "edit") {
      this.#startEditing(category);
    } else {
      this.dispatchEvent(
        new CustomEvent("category-delete", {
          detail: { id: category.id },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  #render() {
    const items = this.#categories.map((category) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const actions = document.createElement("div");
      const edit = document.createElement("button");
      const remove = document.createElement("button");

      item.className = "item";
      item.classList.toggle("editing", category.id === this.#editingId);

      name.className = "name";
      name.textContent = category.name;

      actions.className = "item-actions";

      edit.type = "button";
      edit.className = "small";
      edit.dataset.action = "edit";
      edit.dataset.id = category.id;
      edit.textContent = "Editar";
      edit.setAttribute("aria-label", `Editar la categoría ${category.name}`);

      remove.type = "button";
      remove.className = "small danger";
      remove.dataset.action = "delete";
      remove.dataset.id = category.id;
      remove.textContent = "Eliminar";
      remove.setAttribute("aria-label", `Eliminar la categoría ${category.name}`);

      actions.append(edit, remove);
      item.append(name, actions);

      return item;
    });

    this.listEl.replaceChildren(...items);
    this.listEl.hidden = items.length === 0;
    this.emptyEl.hidden = items.length > 0;
  }
}

if (!customElements.get("category-modal")) {
  customElements.define("category-modal", CategoryModal);
}
