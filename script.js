// Grab references to the elements we'll need to work with
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDueInput = document.getElementById('task-due-input');
const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');
const taskCounter = document.getElementById('task-counter');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortHeaders = document.querySelectorAll('.sort-header');
const weatherEl = document.getElementById('weather');

// Maps Open-Meteo's WMO weather codes to a simple icon
// See https://open-meteo.com/en/docs for the full code list
const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// Fetch and display the current temperature/conditions for the given coordinates
async function loadWeather(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('weather request failed');

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const icon = WEATHER_ICONS[data.current.weather_code] || '🌡️';
    weatherEl.textContent = `${icon} ${temp}°F`;
  } catch {
    weatherEl.textContent = '';
  }
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => loadWeather(position.coords.latitude, position.coords.longitude),
    () => { weatherEl.textContent = ''; },
    { timeout: 8000 }
  );
}

// Apply the given theme ('light' or 'dark') and remember the choice
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

// Use the saved theme if there is one, otherwise fall back to the OS preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(isDark ? 'light' : 'dark');
});

// The tasks array is the source of truth; the list is re-rendered from it
let tasks = [];
let filterState = 'all'; // 'all' | 'active' | 'done'
let sortState = { field: null, direction: 'asc' }; // field: 'dateEntered' | 'text' | 'dueDate'

// Today's date as 'YYYY-MM-DD', for comparing against due dates
function todayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// A task is overdue if it has a due date earlier than today and isn't done
function isOverdue(task) {
  return !task.completed && !!task.dueDate && task.dueDate < todayString();
}

// Format a 'YYYY-MM-DD' due date as something like "Jul 10"
function formatDueDate(dueDate) {
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Compare two tasks by a given field; used for sorting
function compareTasks(a, b, field) {
  if (field === 'text') {
    return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
  }
  if (field === 'dateEntered') {
    return a.dateEntered.localeCompare(b.dateEntered);
  }
  if (field === 'dueDate') {
    return a.dueDate.localeCompare(b.dueDate);
  }
  return 0;
}

// Apply the current filter and sort to the tasks array
function getVisibleTasks() {
  const filtered = tasks.filter((task) => {
    if (filterState === 'active') return !task.completed;
    if (filterState === 'done') return task.completed;
    return true;
  });

  if (!sortState.field) return filtered;

  return filtered.sort((a, b) => {
    // Tasks with no due date always sort last, regardless of direction
    if (sortState.field === 'dueDate') {
      const aHas = !!a.dueDate;
      const bHas = !!b.dueDate;
      if (aHas !== bHas) return aHas ? -1 : 1;
      if (!aHas) return 0;
    }

    const cmp = compareTasks(a, b, sortState.field);
    return sortState.direction === 'asc' ? cmp : -cmp;
  });
}

// Show or hide the "nothing here yet" message based on the visible list
function updateEmptyMessage(visibleCount) {
  const isEmpty = visibleCount === 0;
  emptyMessage.classList.toggle('hidden', !isEmpty);
  if (isEmpty) {
    emptyMessage.textContent = tasks.length === 0
      ? 'Nothing here yet — add your first task above.'
      : 'No tasks match this filter.';
  }
}

// Count active vs. completed tasks (across all tasks, ignoring the filter)
function updateTaskCounter() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;

  taskCounter.textContent = `${active} active · ${completed} done`;
}

// Reflect the current sort field/direction on the header buttons
function updateSortHeaders() {
  sortHeaders.forEach((btn) => {
    const isActive = sortState.field === btn.dataset.field;
    btn.classList.toggle('active', isActive);
    btn.querySelector('.sort-arrow').textContent = isActive
      ? (sortState.direction === 'asc' ? '↑' : '↓')
      : '';
  });
}

// Save the current tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Create a single <li> element for a task
function buildTaskElement(task) {
  const li = document.createElement('li');
  li.classList.toggle('completed', task.completed);
  li.classList.toggle('overdue', isOverdue(task));

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;

  const content = document.createElement('div');
  content.className = 'task-content';

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;
  content.appendChild(span);

  if (task.dueDate) {
    const dueEl = document.createElement('span');
    dueEl.className = 'task-due';
    dueEl.textContent = `Due: ${formatDueDate(task.dueDate)}`;
    content.appendChild(dueEl);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';

  // Toggle the "completed" look when the checkbox is clicked
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    saveTasks();
    render();
  });

  // Remove this task when Delete is clicked
  deleteBtn.addEventListener('click', () => {
    tasks = tasks.filter((t) => t !== task);
    saveTasks();
    render();
  });

  li.appendChild(checkbox);
  li.appendChild(content);
  li.appendChild(deleteBtn);

  return li;
}

// Rebuild the task list in the DOM from the current tasks/filter/sort state
function render() {
  const visible = getVisibleTasks();

  taskList.innerHTML = '';
  visible.forEach((task) => taskList.appendChild(buildTaskElement(task)));

  updateEmptyMessage(visible.length);
  updateTaskCounter();
  updateSortHeaders();
}

// Handle the form submission (adding a new task)
taskForm.addEventListener('submit', (event) => {
  event.preventDefault(); // stop the page from reloading, which is the default form behavior

  const text = taskInput.value.trim();
  if (text === '') return; // ignore empty submissions

  tasks.push({
    text,
    completed: false,
    dateEntered: new Date().toISOString(),
    dueDate: taskDueInput.value || null,
  });

  taskInput.value = ''; // clear the inputs for the next task
  taskDueInput.value = '';
  taskInput.focus();

  saveTasks();
  render();
});

// Switch the active filter tab
filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterState = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

// Sort by the clicked column, toggling direction if it's already active
sortHeaders.forEach((btn) => {
  btn.addEventListener('click', () => {
    const field = btn.dataset.field;
    if (sortState.field === field) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.field = field;
      sortState.direction = 'asc';
    }
    render();
  });
});

// Load any previously saved tasks from localStorage, if present
function loadTasks() {
  let stored = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('tasks'));
    stored = Array.isArray(parsed) ? parsed : [];
  } catch {
    stored = [];
  }

  // Normalize older saved tasks that predate due dates / entry dates
  tasks = stored.map((task) => ({
    text: task.text,
    completed: !!task.completed,
    dateEntered: task.dateEntered || new Date().toISOString(),
    dueDate: task.dueDate || null,
  }));
}

// Set the correct initial state when the page loads
loadTasks();
render();
