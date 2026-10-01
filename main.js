let tasks = [];
let currentEditIndex = -1;

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
        tasks.forEach((task, index) => {
            renderTask(task, index);
        });
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function openAddDialog() {
    currentEditIndex = -1;
    document.getElementById('dialogTitle').textContent = '添加任务';
    document.getElementById('taskName').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDuration').value = '';
    document.getElementById('taskStatus').value = 'todo';
    document.getElementById('volunteerName').value = '';
    document.getElementById('addTaskDialog').showModal();
}

function cancelDialog() {
    document.getElementById('addTaskDialog').close();
}

function submitTask() {
    const name = document.getElementById('taskName').value.trim();
    const desc = document.getElementById('taskDescription').value.trim();
    const duration = document.getElementById('taskDuration').value.trim();
    const status = document.getElementById('taskStatus').value;
    const owner = document.getElementById('volunteerName').value.trim();

    if (!name || !desc || !duration) {
        alert('请填写完整信息');
        return;
    }

    const task = { name, desc, duration, status, owner };

    if (currentEditIndex === -1) {
        tasks.push(task);
        renderTask(task, tasks.length - 1);
    } else {
        tasks[currentEditIndex] = task;
        refreshTasks();
    }

    saveTasks();
    cancelDialog();
}

function renderTask(task, index) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-index', index);
    card.onclick = () => showDetail(index);

    const title = document.createElement('div');
    title.className = 'task-name';
    title.textContent = task.name;

    const description = document.createElement('div');
    description.className = 'task-desc';
    description.textContent = task.desc;

    const footer = document.createElement('div');
    footer.className = 'task-footer';

    const time = document.createElement('span');
    time.className = 'task-duration';
    time.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' + task.duration;

    const badge = document.createElement('span');
    badge.className = 'task-status status-' + task.status;
    badge.textContent = { todo: '待办', doing: '进行中', done: '已完成' }[task.status];

    if ((task.status === 'doing' || task.status === 'done') && task.owner) {
        badge.setAttribute('data-owner', task.owner);
        badge.classList.add('has-tooltip');
    }

    footer.appendChild(time);
    footer.appendChild(badge);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(footer);

    const addButton = document.getElementById('addTaskButton');
    addButton.parentElement.insertBefore(card, addButton);
}

function refreshTasks() {
    const board = document.getElementById('taskBoard');
    const cards = board.querySelectorAll('.task-card');
    cards.forEach(card => card.remove());
    tasks.forEach((task, index) => renderTask(task, index));
}

function showDetail(index) {
    currentEditIndex = index;
    const task = tasks[index];
    const content = document.getElementById('detailContent');

    content.innerHTML = `
        <div class="detail-row"><strong>任务名称:</strong> ${task.name}</div>
        <div class="detail-row"><strong>任务描述:</strong> ${task.desc}</div>
        <div class="detail-row"><strong>任务时长:</strong> ${task.duration}</div>
        <div class="detail-row"><strong>任务状态:</strong> ${{ todo: '待办', doing: '进行中', done: '已完成' }[task.status]}</div>
        <div class="detail-row"><strong>认领人:</strong> ${task.owner || '无'}</div>
    `;

    document.getElementById('detailDialog').showModal();
}

function closeDetailDialog() {
    document.getElementById('detailDialog').close();
}

function editTaskFromDetail() {
    const task = tasks[currentEditIndex];
    document.getElementById('dialogTitle').textContent = '编辑任务';
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDescription').value = task.desc;
    document.getElementById('taskDuration').value = task.duration;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('volunteerName').value = task.owner;

    closeDetailDialog();
    document.getElementById('addTaskDialog').showModal();
}

function deleteTaskFromDetail() {
    if (confirm('确定要删除这个任务吗？')) {
        tasks.splice(currentEditIndex, 1);
        saveTasks();
        refreshTasks();
        closeDetailDialog();
    }
}

function showStats() {
    const stats = {};

    tasks.forEach(task => {
        if ((task.status === 'doing' || task.status === 'done') && task.owner) {
            if (!stats[task.owner]) {
                stats[task.owner] = { total: 0, tasks: [] };
            }
            const hours = parseFloat(task.duration);
            if (!isNaN(hours)) {
                stats[task.owner].total += hours;
                stats[task.owner].tasks.push({ name: task.name, duration: task.duration, status: task.status });
            }
        }
    });

    const content = document.getElementById('statsContent');

    if (Object.keys(stats).length === 0) {
        content.innerHTML = '<div class="no-stats">暂无志愿时长记录</div>';
    } else {
        let html = '<div class="stats-list">';
        Object.entries(stats).forEach(([owner, data]) => {
            html += `<div class="stats-card">
                <div class="stats-header">
                    <span class="stats-name">${owner}</span>
                    <span class="stats-total">${data.total}h</span>
                </div>
                <div class="stats-tasks">`;
            data.tasks.forEach(t => {
                html += `<div class="stats-task-item">
                    <span>${t.name}</span>
                    <span class="stats-duration">${t.duration}</span>
                </div>`;
            });
            html += `</div></div>`;
        });
        html += '</div>';
        content.innerHTML = html;
    }

    document.getElementById('statsDialog').showModal();
}

function closeStatsDialog() {
    document.getElementById('statsDialog').close();
}

window.onload = loadTasks;