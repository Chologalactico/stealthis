/* ============================================================
   ROLE PERMISSION MATRIX — grouped RBAC grid with bulk toggles
   Working matrix diffs against a baseline; Save commits it.
   ============================================================ */

const ROLES = [
  { id: "owner", name: "Owner", locked: true },
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor" },
  { id: "viewer", name: "Viewer" },
];

const GROUPS = [
  {
    name: "Content",
    perms: [
      { id: "posts.create", label: "Create posts" },
      { id: "posts.edit", label: "Edit any post" },
      { id: "posts.delete", label: "Delete posts" },
      { id: "posts.publish", label: "Publish to production" },
    ],
  },
  {
    name: "Members",
    perms: [
      { id: "members.invite", label: "Invite members" },
      { id: "members.remove", label: "Remove members" },
      { id: "members.roles", label: "Assign roles" },
    ],
  },
  {
    name: "Billing",
    perms: [
      { id: "billing.view", label: "View invoices" },
      { id: "billing.payment", label: "Update payment method" },
      { id: "billing.plan", label: "Change plan" },
    ],
  },
  {
    name: "Settings",
    perms: [
      { id: "settings.workspace", label: "Edit workspace settings" },
      { id: "settings.integrations", label: "Manage integrations" },
      { id: "settings.export", label: "Export workspace data" },
    ],
  },
];

/* sensible defaults per role */
const DEFAULT_GRANTS = {
  admin: (id) => !id.startsWith("billing.") || id === "billing.view",
  editor: (id) => id.startsWith("posts.") && id !== "posts.delete",
  viewer: (id) => id === "billing.view",
};

function buildDefaults() {
  const matrix = {};
  for (const group of GROUPS) {
    for (const perm of group.perms) {
      matrix[perm.id] = { owner: true };
      for (const role of ROLES) {
        if (role.id === "owner") continue;
        matrix[perm.id][role.id] = Boolean(DEFAULT_GRANTS[role.id]?.(perm.id));
      }
    }
  }
  return matrix;
}

const clone = (value) => JSON.parse(JSON.stringify(value));

let baseline = buildDefaults();
let matrix = clone(baseline);

const allPermIds = GROUPS.flatMap((g) => g.perms.map((p) => p.id));
const editableRoles = ROLES.filter((r) => !r.locked);

/* ---------- Diff ---------- */
function changes() {
  const list = [];
  for (const permId of allPermIds) {
    for (const role of editableRoles) {
      if (matrix[permId][role.id] !== baseline[permId][role.id]) {
        list.push({ permId, roleId: role.id, granted: matrix[permId][role.id] });
      }
    }
  }
  return list;
}

/* ---------- Render ---------- */
const table = document.getElementById("matrixTable");
const saveBar = document.getElementById("saveBar");
const dirtyCountEl = document.getElementById("dirtyCount");

function render() {
  const head = `
    <thead>
      <tr>
        <th scope="col">Permission</th>
        ${ROLES.map((role) =>
          role.locked
            ? `<th scope="col"><span class="role-head">${role.name}<span class="locked-note">locked</span></span></th>`
            : `<th scope="col"><span class="role-head">${role.name}
                 <button class="role-toggle" type="button" data-role="${role.id}">toggle all</button>
               </span></th>`
        ).join("")}
      </tr>
    </thead>`;

  const body = GROUPS.map(
    (group) => `
      <tr class="group-row"><td colspan="${ROLES.length + 1}">${group.name}</td></tr>
      ${group.perms
        .map(
          (perm) => `
        <tr class="perm-row">
          <th scope="row">
            <span class="perm-label">${perm.label}
              <button class="row-toggle" type="button" data-perm="${perm.id}">toggle row</button>
            </span>
          </th>
          ${ROLES.map((role) => {
            const granted = matrix[perm.id][role.id];
            const dirty = !role.locked && granted !== baseline[perm.id][role.id];
            return `<td class="${dirty ? "is-dirty" : ""}">
              <input type="checkbox" data-perm="${perm.id}" data-role="${role.id}"
                     ${granted ? "checked" : ""} ${role.locked ? "checked disabled" : ""}
                     aria-label="${perm.label} for ${role.name}" />
            </td>`;
          }).join("")}
        </tr>`
        )
        .join("")}`
  ).join("");

  table.innerHTML = head + `<tbody>${body}</tbody>`;

  /* cell checkboxes */
  table.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach((box) => {
    box.addEventListener("change", () => {
      matrix[box.dataset.perm][box.dataset.role] = box.checked;
      render();
    });
  });

  /* column bulk toggle: grant all unless already all granted, then clear */
  table.querySelectorAll(".role-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const roleId = btn.dataset.role;
      const allOn = allPermIds.every((permId) => matrix[permId][roleId]);
      for (const permId of allPermIds) matrix[permId][roleId] = !allOn;
      render();
    });
  });

  /* row bulk toggle across editable roles */
  table.querySelectorAll(".row-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const permId = btn.dataset.perm;
      const allOn = editableRoles.every((role) => matrix[permId][role.id]);
      for (const role of editableRoles) matrix[permId][role.id] = !allOn;
      render();
    });
  });

  /* save bar */
  const diff = changes();
  saveBar.hidden = diff.length === 0;
  dirtyCountEl.textContent = `${diff.length} unsaved change${diff.length === 1 ? "" : "s"}`;
}

/* ---------- Save / discard ---------- */
document.getElementById("saveBtn").addEventListener("click", () => {
  const diff = changes();
  const added = diff.filter((c) => c.granted).length;
  const removed = diff.length - added;
  baseline = clone(matrix);
  render();
  toast(`✓ Saved — ${added} grant${added === 1 ? "" : "s"} added, ${removed} removed`);
});

document.getElementById("discardBtn").addEventListener("click", () => {
  matrix = clone(baseline);
  render();
});

/* ---------- Toast ---------- */
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

render();
