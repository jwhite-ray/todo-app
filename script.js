// Grab references to the elements we'll need to work with
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');
const taskCounter = document.getElementById('task-counter');
const themeToggle = document.getElementById('theme-toggle');

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

// Show or hide the "nothing here yet" message based on whether there are tasks
function updateEmptyMessage() {
  const hasTasks = taskList.children.length > 0;
  emptyMessage.classList.toggle('hidden', hasTasks);
}

// Count active vs. completed tasks and update the counter display
function updateTaskCounter() {
  const allTasks = taskList.querySelectorAll('li');
  const completedTasks = taskList.querySelectorAll('li.completed');
 
  const total = allTasks.length;
  const completed = completedTasks.length;
  const active = total - completed;
 
  taskCounter.textContent = `${active} active · ${completed} done`;
}

// Create a single <li> element for a task
function createTaskElement(text) {
  const li = document.createElement('li');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';

  const span = document.createElement('span');
  span.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';

  // Toggle the "completed" look when the checkbox is clicked
  checkbox.addEventListener('change', () => {
    li.classList.toggle('completed', checkbox.checked);
    updateTaskCounter();
  });

  // Remove this task when Delete is clicked
  deleteBtn.addEventListener('click', () => {
    li.remove();
    updateEmptyMessage();
    updateTaskCounter();
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

// Handle the form submission (adding a new task)
taskForm.addEventListener('submit', (event) => {
  event.preventDefault(); // stop the page from reloading, which is the default form behavior

  const text = taskInput.value.trim();
  if (text === '') return; // ignore empty submissions

  const taskElement = createTaskElement(text);
  taskList.appendChild(taskElement);

  taskInput.value = ''; // clear the input for the next task
  taskInput.focus();

  updateEmptyMessage();
  updateTaskCounter();
});

// Set the correct initial state when the page loads
updateEmptyMessage();
updateTaskCounter();
