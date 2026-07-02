// Grab references to the elements we'll need to work with
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');

// Show or hide the "nothing here yet" message based on whether there are tasks
function updateEmptyMessage() {
  const hasTasks = taskList.children.length > 0;
  emptyMessage.classList.toggle('hidden', hasTasks);
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
  });

  // Remove this task when Delete is clicked
  deleteBtn.addEventListener('click', () => {
    li.remove();
    updateEmptyMessage();
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
});

// Set the correct initial state when the page loads
updateEmptyMessage();
