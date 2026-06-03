const STORAGE_KEY = "rayBudgetBoardExpensesV1";
const BUDGET_KEY = "rayBudgetBoardMonthlyBudgetV1";

const categories = ["餐費", "交通", "看球", "學校", "廟宇", "網站專案", "生活用品", "其他"];

const $ = (selector) => document.querySelector(selector);

const form = $("#expenseForm");
const expenseId = $("#expenseId");
const nameInput = $("#nameInput");
const amountInput = $("#amountInput");
const categoryInput = $("#categoryInput");
const dateInput = $("#dateInput");
const paymentInput = $("#paymentInput");
const noteInput = $("#noteInput");

const formTitle = $("#formTitle");
const cancelEditBtn = $("#cancelEditBtn");
const monthFilter = $("#monthFilter");
const categoryFilter = $("#categoryFilter");
const expenseList = $("#expenseList");
const emptyState = $("#emptyState");

const budgetInput = $("#budgetInput");
const saveBudgetBtn = $("#saveBudgetBtn");
const budgetProgressBar = $("#budgetProgressBar");
const budgetStatusBadge = $("#budgetStatusBadge");
const budgetUsageText = $("#budgetUsageText");
const budgetMessage = $("#budgetMessage");
const remainingText = $("#remainingText");

const monthTotal = $("#monthTotal");
const todayTotal = $("#todayTotal");
const baseballTotal = $("#baseballTotal");
const remainingBudget = $("#remainingBudget");
const categorySummary = $("#categorySummary");

const seedBtn = $("#seedBtn");
const clearBtn = $("#clearBtn");

function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentMonthString() {
  return getTodayString().slice(0, 7);
}

function formatMoney(value) {
  const number = Number(value) || 0;
  return `$${number.toLocaleString("zh-TW")}`;
}

function loadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.warn("支出資料讀取失敗，已改用空陣列。", error);
    return [];
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function loadBudget() {
  return Number(localStorage.getItem(BUDGET_KEY)) || 0;
}

function saveBudget(value) {
  localStorage.setItem(BUDGET_KEY, String(Math.max(0, Number(value) || 0)));
}

function createSeedData() {
  const month = getCurrentMonthString();
  const today = getTodayString();

  return [
    {
      id: crypto.randomUUID(),
      name: "看球門票",
      amount: 1500,
      category: "看球",
      date: `${month}-12`,
      payment: "現金",
      note: "進場應援預算，兄弟逆轉靠氣勢。"
    },
    {
      id: crypto.randomUUID(),
      name: "捷運 TPASS",
      amount: 1200,
      category: "交通",
      date: `${month}-01`,
      payment: "悠遊卡",
      note: "通勤固定支出，月初先守住。"
    },
    {
      id: crypto.randomUUID(),
      name: "午餐",
      amount: 130,
      category: "餐費",
      date: today,
      payment: "現金",
      note: "日常補血，不能餓到九局下。"
    },
    {
      id: crypto.randomUUID(),
      name: "英文課晚餐",
      amount: 90,
      category: "餐費",
      date: today,
      payment: "現金",
      note: "上課前補能量。"
    },
    {
      id: crypto.randomUUID(),
      name: "網站專案素材",
      amount: 100,
      category: "網站專案",
      date: `${month}-08`,
      payment: "LINE Pay",
      note: "Ray Portal 宇宙擴建成本。"
    },
    {
      id: crypto.randomUUID(),
      name: "廟宇香油錢",
      amount: 100,
      category: "廟宇",
      date: `${month}-05`,
      payment: "現金",
      note: "添香油，心也比較穩。"
    }
  ];
}

function ensureInitialData() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveExpenses(createSeedData());
  }

  if (!localStorage.getItem(BUDGET_KEY)) {
    saveBudget(6000);
  }
}

function getFilteredExpenses() {
  const expenses = loadExpenses();
  const selectedMonth = monthFilter.value || getCurrentMonthString();
  const selectedCategory = categoryFilter.value || "全部";

  return expenses
    .filter((expense) => expense.date.startsWith(selectedMonth))
    .filter((expense) => selectedCategory === "全部" || expense.category === selectedCategory)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getMonthExpenses() {
  const expenses = loadExpenses();
  const selectedMonth = monthFilter.value || getCurrentMonthString();
  return expenses.filter((expense) => expense.date.startsWith(selectedMonth));
}

function getBudgetStatus(used, budget) {
  if (budget <= 0) {
    return {
      percent: 0,
      className: "safe",
      label: "尚未開局",
      message: "先設定本月預算，讓錢包守備站好位置。"
    };
  }

  const percent = Math.round((used / budget) * 100);

  if (percent > 100) {
    return {
      percent,
      className: "over",
      label: "錢包被盜壘成功",
      message: "已經爆預算！建議暫停非必要支出，先叫暫停戰術會議。"
    };
  }

  if (percent >= 81) {
    return {
      percent,
      className: "danger",
      label: "牛棚全員熱身",
      message: "預算進入危險區，下一筆花費要小心，不然錢包可能守不住二壘。"
    };
  }

  if (percent >= 51) {
    return {
      percent,
      className: "warning",
      label: "牛棚熱身中",
      message: "支出開始升溫，還能打，但要注意不要被連續安打。"
    };
  }

  return {
    percent,
    className: "safe",
    label: "守備穩定",
    message: "預算安全，錢包目前站位漂亮，守備很穩。"
  };
}

function updateBudgetProgress(monthExpenses) {
  const budget = loadBudget();
  const used = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const remaining = budget - used;
  const status = getBudgetStatus(used, budget);
  const visualPercent = budget <= 0 ? 0 : Math.min(status.percent, 100);

  budgetInput.value = budget || "";
  budgetProgressBar.style.width = `${visualPercent}%`;
  budgetProgressBar.className = `progress-bar ${status.className}`;
  budgetStatusBadge.className = `status-badge ${status.className}`;
  budgetStatusBadge.textContent = status.label;
  budgetUsageText.textContent = `已使用 ${status.percent}%`;
  budgetMessage.textContent = status.message;
  remainingText.textContent = `剩餘 ${formatMoney(remaining)}`;
  remainingBudget.textContent = formatMoney(remaining);
}

function renderStats(monthExpenses) {
  const today = getTodayString();

  const monthSum = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const todaySum = monthExpenses
    .filter((expense) => expense.date === today)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const baseballSum = monthExpenses
    .filter((expense) => expense.category === "看球")
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  monthTotal.textContent = formatMoney(monthSum);
  todayTotal.textContent = formatMoney(todaySum);
  baseballTotal.textContent = formatMoney(baseballSum);
}

function renderExpenses() {
  const expenses = getFilteredExpenses();

  expenseList.innerHTML = "";

  if (expenses.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  expenses.forEach((expense) => {
    const item = document.createElement("article");
    item.className = "expense-item";

    item.innerHTML = `
      <div class="expense-item-header">
        <div>
          <h3 class="expense-name">${escapeHTML(expense.name)}</h3>
          <div class="expense-meta">
            <span class="meta-chip">${escapeHTML(expense.category)}</span>
            <span class="meta-chip">${escapeHTML(expense.date)}</span>
            <span class="meta-chip">${escapeHTML(expense.payment)}</span>
          </div>
          ${expense.note ? `<p class="expense-note">${escapeHTML(expense.note)}</p>` : ""}
        </div>
        <div class="expense-amount">${formatMoney(expense.amount)}</div>
      </div>
      <div class="expense-actions">
        <button class="small-btn" type="button" data-action="edit" data-id="${expense.id}">編輯</button>
        <button class="small-btn delete" type="button" data-action="delete" data-id="${expense.id}">刪除</button>
      </div>
    `;

    expenseList.appendChild(item);
  });
}

function renderCategorySummary(monthExpenses) {
  const totals = categories.map((category) => ({
    category,
    total: monthExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
  })).filter((row) => row.total > 0);

  const max = Math.max(...totals.map((row) => row.total), 1);

  categorySummary.innerHTML = "";

  if (totals.length === 0) {
    categorySummary.innerHTML = `
      <div class="empty-state">
        <strong>沒有分類統計</strong>
        <p>目前這個月份還沒有支出。</p>
      </div>
    `;
    return;
  }

  totals.forEach((row) => {
    const percent = Math.max(4, Math.round((row.total / max) * 100));
    const element = document.createElement("div");
    element.className = "category-row";
    element.innerHTML = `
      <div class="category-topline">
        <span>${escapeHTML(row.category)}</span>
        <strong>${formatMoney(row.total)}</strong>
      </div>
      <div class="category-track">
        <div class="category-bar" style="width: ${percent}%"></div>
      </div>
    `;
    categorySummary.appendChild(element);
  });
}

function renderAll() {
  const monthExpenses = getMonthExpenses();
  renderStats(monthExpenses);
  updateBudgetProgress(monthExpenses);
  renderExpenses();
  renderCategorySummary(monthExpenses);
}

function resetForm() {
  form.reset();
  expenseId.value = "";
  dateInput.value = getTodayString();
  formTitle.textContent = "新增支出紀錄";
  cancelEditBtn.classList.add("hidden");
}

function fillForm(expense) {
  expenseId.value = expense.id;
  nameInput.value = expense.name;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  paymentInput.value = expense.payment;
  noteInput.value = expense.note || "";
  formTitle.textContent = "編輯支出紀錄";
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const expenses = loadExpenses();
  const editingId = expenseId.value;
  const payload = {
    id: editingId || crypto.randomUUID(),
    name: nameInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    payment: paymentInput.value,
    note: noteInput.value.trim()
  };

  if (!payload.name || payload.amount <= 0 || !payload.date) {
    alert("請確認項目名稱、金額與日期都有填好。");
    return;
  }

  const nextExpenses = editingId
    ? expenses.map((expense) => expense.id === editingId ? payload : expense)
    : [payload, ...expenses];

  saveExpenses(nextExpenses);
  resetForm();
  renderAll();
});

expenseList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, id } = button.dataset;
  const expenses = loadExpenses();
  const target = expenses.find((expense) => expense.id === id);

  if (!target) return;

  if (action === "edit") {
    fillForm(target);
  }

  if (action === "delete") {
    const confirmed = confirm(`確定要刪除「${target.name}」嗎？`);
    if (!confirmed) return;

    saveExpenses(expenses.filter((expense) => expense.id !== id));
    renderAll();
  }
});

saveBudgetBtn.addEventListener("click", () => {
  saveBudget(budgetInput.value);
  renderAll();
});

budgetInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveBudget(budgetInput.value);
    renderAll();
  }
});

monthFilter.addEventListener("change", renderAll);
categoryFilter.addEventListener("change", renderAll);

cancelEditBtn.addEventListener("click", resetForm);

seedBtn.addEventListener("click", () => {
  const confirmed = confirm("確定要重置成範例資料嗎？目前資料會被覆蓋。");
  if (!confirmed) return;

  saveExpenses(createSeedData());
  saveBudget(6000);
  resetForm();
  renderAll();
});

clearBtn.addEventListener("click", () => {
  const confirmed = confirm("確定要清空全部支出資料嗎？這球丟出去就回不來了。");
  if (!confirmed) return;

  saveExpenses([]);
  resetForm();
  renderAll();
});

ensureInitialData();
monthFilter.value = getCurrentMonthString();
dateInput.value = getTodayString();
renderAll();
