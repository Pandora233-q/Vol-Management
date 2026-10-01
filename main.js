function add_task_dialog() {
    const dialog = document.querySelector("#addTaskDialog");
    dialog.showModal();
}

function CancelModal() {
    dialog.close();
}

function submit(event) { 
    
    
    var name = document.getElementById("taskName").value;
    var desc = document.getElementById("taskDesc").value;
    var duration = document.getElementById("taskDuration").value;
    // var status = document.getElementById("taskStatus").value;
    // var owner = document.getElementById("taskOwner").value;
    // if (name && desc && duration ) {
        
    //     console.log(name, desc, duration);
        
    // }
    add_task(name, desc, duration, "todo"); 
    
    

    dialog.close();
    
    document.getElementById("taskName").value = "";

}

function add_task(name, desc, duration, status, owner) {
    var task = document.createElement("div");
    task.className = "task-card";

    var title = document.createElement("div");
    title.className = "task-name";
    title.textContent = name;

    var description = document.createElement("div");
    description.className = "task-desc";
    description.textContent = desc;

    var footer = document.createElement("div");
    footer.className = "task-footer";

    var time = document.createElement("span");
    time.className = "task-duration";
    time.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
        duration;

    var badge = document.createElement("span");
    badge.className = "task-status status-" + status;
    badge.textContent = { todo: "待办", doing: "进行中", done: "已完成" }[status];

    if (status === "doing" && owner) {
        badge.setAttribute("data-owner", owner);
        badge.classList.add("has-tooltip");
    }

    footer.appendChild(time);
    footer.appendChild(badge);

    task.appendChild(title);
    task.appendChild(description);
    task.appendChild(footer);

    document.getElementById("taskBoard").appendChild(task);
}

