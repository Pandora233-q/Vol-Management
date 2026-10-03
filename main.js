let tasks = [];
let currentEditIndex = -1;

// function handleExport(event) { 
//     const blob = new Blob([JSON.stringify(tasks)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     const filename = `tasks_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//     event.preventDefault();
//     return false;
// }
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
    // localStorage.removeItem('tasks');
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
        let html = '<div class="chart-container"><canvas id="statsChart"></canvas></div>';
        html += '<div class="stats-list">';
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

        setTimeout(() => renderChart(stats), 100);
    }

    document.getElementById('statsDialog').showModal();
}

function renderChart(stats) {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '300px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 300;
    const padding = 60;
    const chartHeight = height - padding * 2;

    const owners = Object.keys(stats);
    const values = owners.map(owner => stats[owner].total);
    const maxValue = Math.max(...values);

    const barWidth = (width - padding * 2) / owners.length * 0.6;
    const gap = (width - padding * 2) / owners.length;

    ctx.fillStyle = '#fafaf9';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const gridLines = 5;
    ctx.strokeStyle = '#f5f5f4';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        const value = maxValue - (maxValue / gridLines) * i;
        ctx.fillStyle = '#a8a29e';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(1) + 'h', padding - 10, y + 4);
    }

    owners.forEach((owner, index) => {
        const value = values[index];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + gap * index + (gap - barWidth) / 2;
        const y = height - padding - barHeight;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#1c1917';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(owner, x + barWidth / 2, height - padding + 20);

        ctx.fillStyle = '#57534e';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillText(value + 'h', x + barWidth / 2, y - 8);
    });
}

function closeStatsDialog() {
    document.getElementById('statsDialog').close();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const records = JSON.parse(e.target.result);
            importRecords(records);
            event.target.value = '';
        } catch (error) {
            alert('JSON格式错误，请检查文件格式');
        }
    };
    reader.readAsText(file);
}

function importRecords(records) {
    let importCount = 0;

    records.forEach(person => {
        if (person.name && person.tasks && Array.isArray(person.tasks)) {
            person.tasks.forEach(task => {
                const newTask = {
                    name: task.taskName || '未命名任务',
                    desc: task.description || '',
                    duration: task.duration || '0h',
                    status: task.status || 'todo',
                    owner: person.name
                };
                // if (!tasks.includes(newTask)) {
                tasks.push(newTask);
                importCount++;
            // }
            });
        }
    });

    if (importCount > 0) {
        saveTasks();
        refreshTasks();
        alert(`成功导入 ${importCount} 条任务记录`);
        showStats();
    } else {
        alert('未找到有效的任务记录');
    }
}

window.onload = loadTasks;