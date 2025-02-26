var username = ""; //client username
var password = ""; //client password
var tasklist = []; //client side task list
var server_ip = '127.0.0.1'; //ip of server
var sortMethod = 0; //0= due date, 1= start date, 2= priority, 3=alphebetically, 4=newest to oldest, 5=oldest to newest
var usePost = false;//whether we should use post
var useDelete = false; //whether we should use delete
var waitingOnResponse = false; //whether we are waiting on a server response
var timesSaved = 0; //how many times we have saved
var last30DayOnTimeTasks = 0; //how many tasks have been completed in the last 30 days on time
var last30DayTasks = 0; //how many tasks have been completed in the last 30 days
var needToRender = false; //holds whether we should re-render the task list

window.alert = function() {};

updateJQuery(); //just confirm we have the jquery library

/**
 * Task is the class that handles everything related to task.
 * @author Team
 */
class Task {
  name; //task name (can be changed by user)
  description; //task description (can directly be changed by user)
  taskID = "0"; //unique task id (can sort of be changed by user)
  priority = 0; //user-set priority value (can be changed by user)
  complete = false; //is this marked as complete? (can be changed by user)
  completeDate = new Date(); //when was the task completed (can sort of be changed by user)
  dueDate = new Date(); //what is the user-set due date (can be changed by user)
  startDate = new Date(); //when was this task created (cannot be changed by user)

  /** 
  * @constructor
  * @author Emma
  */
  constructor(name, description) {
    if (typeof name === 'string') this.name = name;
    else console.error(`Task.name expected type 'string'`);
    if (typeof description === 'string') this.description = description;
    else console.error(`Task.description expected type 'string'`);
    this.startDate = new Date();
    if (name.includes("|")) console.error("Your task name cannot contain the \"|\" character.");
    this.taskID = Task.generateTaskID(this, tasklist);
    this.completeDate = new Date();
    this.dueDate = new Date();
    this.startDate = new Date();
  }

  /**
   * generate a unique task id based on the name of the task
   * @param {Task} tas task object you with to create an id for
   * @param {Array<Task>} tasks the array of tasks you
   * @returns 
   */
  static generateTaskID(tas, tasks) {
    let idealid = tas.name.replace(/ /g, "^");
    let j = 0;
    for (let i = 0; i < tasks.length; i++) {
      while (tasks[i] === undefined || tasks[i].taskID === undefined) {
        i++;
        if (i >= tasks.length) {
          return idealid;
        }
      }
      if (tasks[i].taskID === idealid && !(tasks[i] == tas)) {
        idealid += j;
        if (j < 9007199254740992) {
          j++;
        } else {
          alert("There was an issue while generating that task's unique ID. Please make sure you don't have more tasks with that same name.");
          return "!";
        }
        i = 0;
      }
    }
    return idealid;
  }

  /** 
  * do not use this method. this is merely for sorting methods
  * @param {Array<Task>} t2 - A task object you wish to compare this with
  * @return {int} - 0 if the tasks are equal in date, 1 if the given object was created later, and -1 if this object was created later
  * @author Ben
  */
  compareOldToNew(t2) {
    if (this.startDate < t2.startDate) return -1;
    else if (this.startDate > t2.startDate) return 1;
    else return 0;
  }

  /** 
  * @param {Array<Task>} tasks - the array you wish to sort. sortGiven will sort the array you give, instead of returning a copy
  * @author Ben
  */
  static sortGivenOldToNew(tasks) {
    tasks.sort(function (a, b) {
      return a.compareOldToNew(b);
    });
  }


  /** 
  * you should not use this method. this is for various sorting methods
  * @param {Task} t2 - A task object you wish to compare this with
  * @return {int} - 0 if the tasks are equal in date, -1 if the given object was created later, and 1 if this object was created later
  * @author Ben
  */
  compareNewToOld(t2) {
    if (this.startDate < t2.startDate) return 1;
    else if (this.startDate > t2.startDate) return -1;
    else return 0;
  }

  /** 
  * @param {Array<Task>} tasks - the array you wish to sort. this will sort the given array, as opposed to a copy.
  * @author Ben
  */
  static sortGivenNewToOld(tasks) {
    tasks.sort(function (a, b) {
      return a.compareNewToOld(b);
    });
  }

  static sortGivenAlphabetically(tasks) {
    tasks.sort(function (a, b) {
      if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
      if (a.name.toUpperCase() > b.name.toUpperCase()) return 1;
      return 0;
    });
  }

  /**
   * this method compares which of two tasks is closer to a given date. You should not use this method, it is only for sort methods to use
   * @param {Task} t2 the other task to compare this to
   * @param {Date} dat the date to compare this and t2 to
   * @param {boolean} includeOutdatedTasks do you want to include tasks that have been outdated
   * @param {boolean} includeFinishedTasks do you want to include tasks that have been marked as completed
   * @returns 0 if the two are equal, -1 if this is closer to dat, and 1 if t2 is closer to dat
   */
  compareClosestToDueDate(t2, dat, includeOutdatedTasks, includeFinishedTasks) {
    if (!includeOutdatedTasks) { //if we care about outdated tasks, check to see if any of them are outdated
      if (this.dueDate < dat && t2.dueDate > dat) return 1;
      if (this.dueDate > dat && t2.dueDate < dat) return -1;
      if (this.dueDate < dat && t2.dueDate < dat) return 0; //if we want to exclude outated tasks and they're both outdated, we say they be equal
    }
    if (!includeFinishedTasks) {//this only runs when we care about finished tasks
      if (!this.complete && t2.complete) return -1;
      if (this.complete && !t2.complete) return 1;
      if (this.complete && t2.complete) return 0;
    }
    return Math.abs(this.dueDate - dat) < Math.abs(t2.dueDate - dat) ? -1 : 1; //use math.abs to check
  }

  /**
   * this method sorts the given array based on which tasks are closest to dat. it will modify the given array, not a copy!
   * @param {Array<Task>} tasks the array to sort
   * @param {Date} dat the date to compare all the due dates to
   * @param {boolean} includeOutdatedTasks should we include outdated tasks? if not, we delete them from the array
   * @param {boolean} includeFinishedTasks should we include completed tasks? if not, we delete them from the array
   */
  static sortGivenClosestToDueDate(tasks, dat, includeOutdatedTasks, includeFinishedTasks) {
    tasks.sort(function (a, b) {
      return a.compareClosestToDueDate(b, dat, includeOutdatedTasks, includeFinishedTasks);
    });

  }

  /**
   * this method compares which of two tasks is closer to a given date. You should not use this method, it is only for sort methods to use
   * @param {Task} t2 the other task to compare this to
   * @param {Date} dat the date to compare this and t2 to
   * @param {boolean} includeOutdatedTasks do you want to include tasks that have been outdated
   * @param {boolean} includeFinishedTasks do you want to include tasks that have been marked as completed
   * @returns 0 if the two are equal, -1 if this is closer to dat, and 1 if t2 is closer to dat
   */
  compareClosestToStartDate(t2, dat, includeOutdatedTasks, includeFinishedTasks) {
    if (!includeOutdatedTasks) { //if we care about outdated tasks, check to see if any of them are outdated
      if (this.startDate < dat && t2.startDate > dat) return 1;
      if (this.startDate > dat && t2.startDate < dat) return -1;
      if (this.startDate < dat && t2.startDate < dat) return 0; //if we want to exclude outated tasks and they're both outdated, we say they be equal
    }
    if (!includeFinishedTasks) {//this only runs when we care about finished tasks
      if (!this.complete && t2.complete) return -1;
      if (this.complete && !t2.complete) return 1;
      if (this.complete && t2.complete) return 0;
    }
    return Math.abs(this.startDate - dat) < Math.abs(t2.startDate - dat) ? -1 : 1; //use math.abs to check
  }

  /**
   * this method sorts the given array based on which tasks are closest to dat. it will modify the given array, not a copy!
   * @param {Array<Task>} tasks the array to sort
   * @param {Date} dat the date to compare all the due dates to
   * @param {boolean} includeOutdatedTasks should we include outdated tasks? if not, we delete them from the array
   * @param {boolean} includeFinishedTasks should we include completed tasks? if not, we delete them from the array
   */
  static sortGivenClosestToStartDate(tasks, dat, includeOutdatedTasks, includeFinishedTasks) {
    tasks.sort(function (a, b) {
      return a.compareClosestToStartDate(b, dat, includeOutdatedTasks, includeFinishedTasks);
    });
  }

  static sortByUrgency(arr) {
    arr.sort(function(a,b) {
      if (a.priority>b.priority) return -1;
      if (b.priority>a.priority) return 1;
      return 0;
    });
  }

  /** 
  * Contruct a Task object from the given string; used to convert .txt files to Tasks for the client
  * @param {string} taskString - The string to convert
  * @return {object} - A Task object with the given parameters
  * @author Emma <CLASSIFIED>
  */
  static parse(taskString) {
    taskString += '';
    console.log(taskString);
    let modi = taskString.replace(/\^/g, " ");
    console.log(modi);
    let arr = modi.split("|");
    let output = new Task(arr[0] + '', arr[1] + '');
    output.priority = arr[2];
    if (arr[3] == 'true') {
      output.complete = true;
    } else {
      output.complete = false;
    }
    output.completeDate = new Date(Date.parse(arr[4]));
    output.dueDate = new Date(Date.parse(arr[5]));
    output.startDate = new Date(Date.parse(arr[6]));
    return output;
  }

  

  /** 
  * @return {string} - A string representation of the Task
  * @author Emma <CLASSIFIED>
  */
  toString() {
    return `${this.name}|${this.description}|${this.priority}|${this.complete}|${this.completeDate.toISOString()}|${this.dueDate.toISOString()}|${this.startDate.toISOString()}`.replace(/ /g, "^");
  }

  /**
   * takes a task object and converts it to an html element
   * @param {Task} tas The task object you wish to convert
   * @returns {String} a string object containing the html element
   */
  static convertToHTML(tas) {
    var today = new Date();
    let rd = new Date(new Date().setDate(today.getDate() - 30));
    let rn = new Date();
    tas.name = tas.name.replace(/\|/g,'');
    tas.name = tas.name.replace(/\^/g,'');
    if (tas.priority===undefined) tas.priority = '';
    tas.description = tas.description.replace(/\|/g,'');
    tas.description = tas.description.replace(/\^/g,'');
    let ex = tas.priority;
    let valOrDf = "value";
    if (tas.name === 'New Task') {
      valOrDf = "placeholder";
    }
    let act = ' active';
    let act2 = 'un';
    if (!tas.complete) {
      act = '';
      act2 = '';
    }
    if (tas.completeDate<=today&&tas.completeDate>rd) {
      last30DayTasks++;
      if (tas.completeDate<tas.dueDate) {
        last30DayOnTimeTasks++;
      }
    }
    let compDate = `${tas.completeDate.getDate()}/${tas.completeDate.getMonth() + 1}/${(tas.completeDate.getFullYear() + '').slice(2)}`;
    if (tas.completeDate.getFullYear() < 2000) {
      compDate = 'Task is not marked as completed.';
    }
    let style = '';
    if (!document.getElementById(`show-completed`).checked&&tas.complete) {
      style = 'style="display: none;"';
    }
    if (!document.getElementById(`show-overdue`).checked&&tas.dueDate<rn) {
      style = 'style="display: none;" ';
    }    
    let fin = `<li ${style}id="task:${tas.taskID}" class="task">
    <h2 class="task-header">
            <input onchange="saveChanges()" class="task-name" type="text" ${valOrDf}="${tas.name}" />
            <span id='${tas.taskID}-comp-checker' class="checkbox${act}" onclick="{${act2}completeTask(this); saveChanges(); renderTasks();}"></span>
          </h2>
          <hr />
          <div class="task-about">
          <p class="task-due">DUE:
  <input type="number" placeholder="DD" class="day" min="1" max="31" onchange="{dateCheck(this); saveChanges();}" value="${tas.dueDate.getDate()}"/>/<input
                type="number" placeholder="MM" class="month" min="1" max="12" onchange="{dateCheck(this); saveChanges();}" value="${tas.dueDate.getMonth() + 1}"/>/<input
                type="number" placeholder="YY" class="year" min="0" max="99" onchange="{dateCheck(this); saveChanges();}" value="${(tas.dueDate.getFullYear() + '').slice(2)}"/>
                </p>
                <span style="display: flex;">
                <span>Urgency: </span>
                <input type="number" min="0" max="9" placeholder="Urgency..." onchange="saveChanges()" value="${ex}" class="priority" />
                </span>
          </div>
          <div class="task-details hide">
            <p class="task-description">
              <textarea class="task-description-area" role="input" placeholder="Description..." onchange="saveChanges()">${tas.description}</textarea>
            </p>
            <p class="completed-date">Date Completed: ${compDate}</p>
            <p class="started-date">Date Created: ${tas.startDate.getDate()}/${tas.startDate.getMonth() + 1}/${(tas.startDate.getFullYear() + '').slice(2)}</p>
            <div class="center-wrapper">
              <button class="tiny" onclick="{deleteTaskWithID('${tas.taskID}'); saveChanges();}">Delete This Task</button>
            </div>
          </div>
          <div class="task-details-show" role="button" tab-index="0" onclick="{showDetails(this); saveChanges();}">Show details</div>
          <div class="task-details-hide hide" role="button" tab-index="0" onclick="{ hideDetails(this); saveChanges();}">Hide details</div>
        </li>`;
    return fin;
  }

  static parseHTML(htmlstring, i) {
    if (!(document.getElementsByClassName('task')[i].id.slice(0,5)==='task:')) {
      console.error('there was a big issue a task\'s id');
    }
    let id = document.getElementsByClassName('task')[i].id.slice(5);
    let nam = document.getElementsByClassName("task-name")[i].value;
    let desc = document.getElementsByClassName('task-description-area')[i].value;
    let day = parseInt(document.getElementsByClassName("day")[i].value);
    let month = parseInt(document.getElementsByClassName("month")[i].value);
    let year = parseInt(document.getElementsByClassName("year")[i].value);
    let starDatCon = document.getElementsByClassName('started-date')[i].innerHTML;
    let starDat = new Date(parseInt(starDatCon.split('/')[2])+2000,parseInt(starDatCon.split('/')[1]-1),parseInt(starDatCon.split('/')[0].slice(14)));
    console.log(starDat);
    let compDatCon = document.getElementsByClassName('completed-date')[i].innerHTML;
    let compDat;
    if (compDatCon==='Date Completed: Task is not marked as completed.') {
      compDat = new Date(1970,0,1);
    } else compDat = new Date(parseInt(compDatCon.split('/')[2])+2000,parseInt(compDatCon.split('/')[1]-1),parseInt(compDatCon.split('/')[0].slice(16)));
    console.log(compDat);
    day = checkMonthUsingAll(month, day, year);
    if (year > 99) year = 99;
    if (month > 12) year = 12;
    let due = new Date(year + 2000, month - 1, day);
    let prior = parseInt(document.getElementsByClassName('priority')[i].value);
    console.log(prior);
    if (nam.includes("|")||desc.indexOf("\|")>-1||nam.indexOf("\^")>-1||desc.indexOf("\^")>-1) {
      let not = new Task('Character Notification.','Hey, we noticed you used a pipe or a caret character somewhere in one of your tasks. If you are seeing this, that means we sadly had to remove it, because we use it as an escape character in our code. Apologies, and please enjoy other legal characters such as the powerful arroba, the captivating ampersand, the numeric octothorpe, or the twin siblings of destruction, left and right parenthesis.');
      not.dueDate = new Date();
      not.startDate = new Date(starDat);
      not.completeDate = new Date(1970,0,1);
      not.priority = 1;
      tasklist.push(not);
      needToRender = true;
    }
    console.log(nam);
    nam = nam.replace(/\|/g,'');
    nam = nam.replace(/\^/g,'');
    desc = desc.replace(/\|/g,'');
    desc = desc.replace(/\^/g,'');
    let t = new Task(nam, desc);
    console.log(document.getElementById(`${id}-comp-checker`));
    t.complete = document.getElementById(`${id}-comp-checker`).className.indexOf('i')>-1;
    t.priority = prior;
    if (t.priority>9) t.priority = 9;
    if (t.priority<0) t.priority = 0;
    t.taskID = id;
    t.dueDate = new Date(due);
    t.startDate = new Date(starDat);
    t.completeDate = new Date(compDat);
    return t;
  }
}

function _getcb(data) {
  if (waitingOnResponse) { //if we are not waiting on a response, don't even bother.
    waitingOnResponse = false;
    let deter = JSON.stringify(data).split("\"")[1];
    if (deter === '626') {
      let appli = JSON.stringify(data).split("\"")[5];
      if (appli === '476') {
        document.getElementById("submit").textContent = "Submit (Username/Password Incorrect)"; //if the server sends a denial, this is why
      }
      if (appli === '358') {
        document.getElementById("submit").textContent = "Submit (Approved, Redirecting...)";//server approved
        makeTaskRequest(); //make a task request
      }
    }
    if (deter === '848') {
      let appli = JSON.stringify(data).split("\"")[5];
      console.log(appli);
      if (appli === '476') {
        document.getElementById("submit").textContent = "Submit (Server Denied Request)";
      }
      if (appli === '456') {
        document.getElementById("submit").textContent = "Submit (Username Already In Use)";
      }
      if (appli === '358') {
        document.getElementById("submit").textContent = "Submit (Account Created, Redirecting...)";
        makeTaskRequest();
        updateCSS("homestyles.css");
        updateJQuery();
      }
    }
    if (deter === '789') {
      let appli = JSON.stringify(data).split("\"")[5];
      if (appli === '476') {
        alert("A Server Error Occured, That Prevented Getting the Task List. Please try again another time.");
      }
      if (appli === '358') {
        codedTasks = JSON.stringify(data).split("\"")[9];
        codedTasks = codedTasks.slice(0, -2);
        codedTasklist = smart95Split(codedTasks);
        tasklist = [];
        for (let i = 0; i < codedTasklist.length; i++) {
          codedTasklist[i] += '';
          tasklist.push(Task.parse(convertToMessage(codedTasklist[i])));
        }
        updateToHome();
      }
    }
    if (deter === '094') {
      let appli = JSON.stringify(data).split("\"")[5];
      console.log(appli);
      if (appli === '476') {
        alert("A Server Error Occured, That Prevented Deletion. Please try again another time.");
      }
      if (appli === '358') {
        updateToLogin();
      }
    }
    if (deter === '878') {
      let appli = JSON.stringify(data).split("\"")[5];
      console.log(appli);
      if (appli === '476') {
        alert("A Server Error Occured, That Prevented Saving the task list. Please try again another time.");
      }
      if (appli === '358') {
        console.log('Tasks saved for the ' + timesSaved + ' time.');
      }
    }
  }

}

console.log('Javascript file loaded.');

/**
 * Scrapes the html page to get the user's updated tasks, then updates them and sends them to the server
 * @author Ben
 */
function saveChanges() {
  timesSaved++;
  tasklist = [];
  let elems = document.getElementsByClassName("task");
  for (let i = 0; i < elems.length; i++) {
    let curr = Task.parseHTML(elems[i].outerHTML, i);
    tasklist.push(curr);
  }
  let dater = "";
  for (let i = 0; i < tasklist.length; i++) {
    if (i == tasklist.length - 1) {
      dater += convertToNumber(tasklist[i].toString()) + "96";
    } else dater += convertToNumber(tasklist[i].toString()) + "95";
  }
  let typ = 'PUT';
  if (usePost) typ = 'POST';
  usePost = false;
  if (useDelete) type = 'DELETE';
  useDelete = false;
  makeManualServerRequest("165" + convertToNumber(username) + "95" + convertToNumber(password) + "97" + dater, typ);
  if (needToRender) {
    needToRender = false;
    makeTaskRequest();
  }
}

function updateCSS(fil) {
  document.getElementById("css-thing").setAttribute("href", fil);
}

function sorter(i) {
    saveChanges();
    sortMethod = i;
    renderTasks()
}

function addNewTask() {
  let t = new Task("New Task", "");
  let rn = new Date();
  t.startDate = new Date(rn);
  t.dueDate = new Date(rn);
  t.completeDate = new Date(1970,0,1);
  t.priority = 'Priority...';
  tasklist.push(t);
  usePost = true;
  renderTasks();
}



/**
* Ensures all date values are valid.
* @author Emma
*/
function dateCheck(origin) {
  let parent = origin.parentElement;
  let month = parent.getElementsByClassName('month')[0];
  let day = parent.getElementsByClassName('day')[0];
  let year = parent.getElementsByClassName('year')[0];

  // Calculate maximum day value
  let dayMax;
  if (month.value == 1 || month.value == 3 || month.value == 5 || month.value == 7 || month.value == 8 || month.value == 10 || month.value == 12) {
    dayMax = 31;
  } else if (month.value == 2) {
    if (year.value % 4 == 0 && (year.value % 100 != 0 || year.value % 400 == 0)) {
      dayMax = 29;
    } else {
      dayMax = 28;
    }
  } else {
    dayMax = 30;
  }

  // Verify day
  if (day.value < 1) day.value = 1;
  day.min = 1;
  if (day.value > dayMax) day.value = dayMax;
  day.max = dayMax;

  // Verify month
  if (month.value < 1) month.value = 1;
  month.min = 1;
  if (month.value > 12) month.value = 12;
  month.max = 12;

  // Verify year
  if (year.value < 0) year.value = 0;
  year.min = 0;
  if (year.value > 99) year.value = 99;
  year.max = 99;
}

function renderTasks() {
  let update = "";
  let arr = tasklist;
  last30DayTasks = 0;
  last30DayOnTimeTasks = 0;
  switch (sortMethod) {
    case (0):
      Task.sortGivenClosestToDueDate(arr, new Date(), document.getElementById("show-overdue").checked, document.getElementById("show-completed").checked);
      break;
    case (1):
      Task.sortGivenClosestToStartDate(arr, new Date(), document.getElementById("show-overdue").checked, document.getElementById("show-completed").checked);//scrapped due to doing the same thing as new to old
      break;
    case (2):
      Task.sortByUrgency(arr);
      break;
    case (3):
      Task.sortGivenAlphabetically(arr);
      break;
    case (4):
      Task.sortGivenNewToOld(arr);
      break;
    case (5):
      Task.sortGivenOldToNew(arr);
      break;
  }
  for (let i = 0; i < arr.length; i++) {
    update += Task.convertToHTML(arr[i]);
  }
  document.getElementsByClassName("task-list")[0].innerHTML = update;
  document.getElementById("30-tasks").innerHTML="Completed: "+last30DayTasks;
  document.getElementById("30-tasks-time").innerHTML = "Completed on time: "+last30DayOnTimeTasks;
}

function smart95Split(seq) {
  let arr = [];
  let lastChop = 0;
  for (let i = 0; i < seq.length; i += 2) {
    if (seq.charAt(i) === '9' && seq.charAt(i + 1) === '5') {
      arr.push(seq.substring(lastChop, i));
      lastChop = i + 2;
    }
  }
  if (lastChop == 0) arr = [seq]; else arr.push(seq.substring(lastChop, seq.length));
  return arr;
}

function pause(ms) {
  let x = 1;
  let y = null;
  setTimeout(function () {
    x = x * 3 + 2;
    y = x / 2;
  }, ms);
}

function makeTaskRequest() {
  makeServerRequest("932" + convertToNumber(username) + "95" + convertToNumber(password) + "96");
}

function updateToLogin() {
  updateCSS("styles.css");
  updateJQuery();
  document.getElementsByTagName("body")[0].innerHTML = `<section id="login">
  <header id="login-banner" class="banner">EQUILIBRIUM</header>
  <div id="login-body" class="section-body">
    <div class="card">
        <nav class="card-tabs">
            <li id="login-tab" class="active" onclick="activateLoginMode()" tab-controls="#login">Log in</li>
            <li id="create-account-tab" onclick="activateCreateAccountMode()" tab-controls="#create-account">Create account</li>
        </nav>
        <div id="login" class="card-body tab-content active">
            <form>
                <label for="username">Username</label>
                <div class="input-text" id="username-input" contenteditable onkeydown="if (event.keyCode == 13) { submitButton(); return false; }"></div>
                <label for="password">Password</label>
                <div class="input-text" id="password-input" contenteditable onkeydown="if (event.keyCode == 13) { submitButton(); return false; }"></div>
                <div class="center-wrapper">
                  <div id="submit" onclick="submitButton()" class="btn">Submit</div>
                </div>
            </form>
        </div>
        <div id="create-account" class="card-body tab-content">
        </div>
    </div>
  </div>
</section>`;
}


function updateToHome() {
  updateCSS("homestyles.css");
  updateJQuery();
  let update = `<section>
  <div class="section-body main-body">
    <ul class="task-list">
      <div class="center-wrapper">
        <button id="save" class="modi-button hide">Save changes</button>
      </div>
    </ul>
    <aside id="sidebar">
      <button class="big" onclick="{addNewTask(); saveChanges();}">+ New task</button>
      <ul id="sort-by" class="button-list" role="fieldset">
        <li class="header">
          <h3 role="legend">Sort by:</h3>
        </li>
        <li>
          <input id="due-date" type="radio" name="sort" onclick="sorter(0)" checked />
          <label for="due-date">Due date</label>
        </li>
        <li>
          <input id="urgency" type="radio" name="sort" onclick="sorter(2)" />
          <label for="urgency">By Urgency</label>
        </li>
        <li>
          <input id="alphabet" type="radio" name="sort" onclick="sorter(3)" />
          <label for="alphabet">Alphabetically</label>
        </li>
        <li>
          <input id="new-to-old" type="radio" name="sort" onclick="sorter(4)" />
          <label for="new-to-old">Newest to oldest</label>
        </li>
        <li>
          <input id="old-to-new" type="radio" name="sort" onclick="sorter(5)" />
          <label for="old-to-new">Oldest to newest</label>
        </li>
        <li class="header">
          <h3>Show:</h3>
        </li>
        <li>
          <input id="show-completed" type="checkbox" onclick="{saveChanges(); renderTasks();}" checked />
          <label for="show-completed">Completed</label>
        </li>
        <li>
          <input id="show-overdue" type="checkbox" onclick="{saveChanges(); renderTasks();}" checked />
          <label for="show-overdue">Overdue</label>
        </li>
        <li class="header">
          <h3>Tasks Completed In The Last 30 Days:</h3>
        </li>
        <p id="30-tasks">Completed:</p>
        <p id="30-tasks-time">Completed on time:</p>
      </ul>
      <button class="small" onclick="logOut()">Log out</button>
    </aside>
  </div>
</section>`;
  document.getElementsByTagName("body")[0].innerHTML = update;
  renderTasks();
}

function logOut() {
  tasklist=[];
  username='';
  password='';
  updateToLogin();
}

function updateJQuery() {
  var body = document.getElementsByTagName("body")[0];
  var script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
  body.appendChild(script);
}

function submitButton() {
  username = document.getElementById('username-input').innerHTML;
  password = document.getElementById('password-input').innerHTML;
  console.log(username);
  console.log(password);
  if (document.getElementById('login-tab').className === "active") {
    makeServerRequest('651' + convertToNumber(username) + '95' + convertToNumber(password) + '96');
  }
  if (document.getElementById('create-account-tab').className === 'active') {
    makeServerRequest('872' + convertToNumber(username) + '95' + convertToNumber(password) + '96');
  }
}

/**
 * this activates log in mode
 * @author Ben
 */
function activateLoginMode() {
  document.getElementById('create-account-tab').className = "";
  document.getElementById('login-tab').className = "active";
  document.getElementById("submit").textContent = "Submit";
}
function activateCreateAccountMode() {
  document.getElementById('create-account-tab').className = "active";
  document.getElementById('login-tab').className = "";
  document.getElementById("submit").textContent = "Submit";
}

function splitStringIntoThing(strin) {
  let arra = [];
  for (let i = 0; i < strin.length; i += 2) arra.push(strin.slice(i, i + 2));
  return arra;
}

function convertToNumber(message) {
  if (typeof message === 'string') {
    let fina = "";
    let arr = Array.from(message);
    let keys = getEncodeMap()
    for (let i = 0; i < arr.length; i++) {
      let temp = keys.get(arr[i]);
      if (temp==='undefined'||temp===undefined) {
        needToRender = true;
        console.log(temp);
        temp = '?';
        console.log(temp);
        temp = keys.get('?');
      }
      fina += temp;
    }  
      

    return fina;
  } else {
    console.error("convertToNumber expected type string");
    return "error";
  }
}

function convertToMessage(number) {
  if (typeof number === 'string') {
    let fina = "";
    let arr = splitStringIntoThing(number);
    let keys = getDecodeMap();
    for (let i = 0; i < arr.length; i++) fina += keys.get(String(arr[i]));
    return fina;
  } else {
    console.error("convertToMessage expected type string");
    return "error";
  }
}

function checkMonthUsingAll(month, day, year) {
  let monthValue = month;
  if (day < 1) return 1;
  if (monthValue == 1 || monthValue == 3 || monthValue == 5 || monthValue == 7 || monthValue == 8 || monthValue == 10 || monthValue == 12) {
    if (day > 31) return 31;
  } else if (monthValue == 2) {
    if (year % 4 == 0) {
      if (year % 100 == 0 && year % 400 != 0) {
        if (day > 28) return 28;
      } else if (day > 29) return 29;
    } else {
      if (day > 28) return 28;
    }
  } else {
    if (day > 30) return 30;
  }
  return day;
}

function makeManualServerRequest(dat, ty) {
  if (true) {
    jQuery.ajax({
      type: ty,
      url: `http://${server_ip}:3000/serverscript.js`,
      async: false,
      contentType: "text/javascript",
      dataType: "jsonp",
      jsonpCallback: '_getcb',
      cache: false,
      timeout: 5000,
      data: dat,
      success: function (data) { },
      error: function (jqXHR, textStatus, errorThrown) {
        alert('error ' + textStatus + " " + errorThrown);
      }
    });
    waitingOnResponse = true;
  }
}

function makeServerRequest(dat) {
  makeManualServerRequest(dat, 'GET');
}

/** 
* Displays the details of the given .task element.
* @param btn - The .task element's 'show details' button
* @author Emma
*/
function showDetails(btn) {
  btn.parentElement.getElementsByClassName('task-details')[0].classList.remove('hide');
  btn.parentElement.getElementsByClassName('task-details-hide')[0].classList.remove('hide');
  btn.classList.add('hide');
}

/** 
* Hides the details of the given .task element.
* @param btn - The .task element's 'hide details' button
* @author Emma
*/
function hideDetails(btn) {
  btn.parentElement.getElementsByClassName('task-details')[0].classList.add('hide');
  btn.parentElement.getElementsByClassName('task-details-show')[0].classList.remove('hide');
  btn.classList.add('hide');
}

/** 
* Will be called from the .task's checkbox in the markup; should mark the Task as complete and check the checkbox.
* NOTE: You understand the Task processing better than I do. Do you think you could write the part that updates the appropriate Task's completion field? - Emma
* @param checkbox - The .task's checkbox
*/
function completeTask(checkbox) {
  checkbox.classList.add('active');
  checkbox.setAttribute('onclick', 'uncompleteTask(this)');
  let pos = 0;
  let id = checkbox.parentElement.parentElement.id.substring(5);
  for (let i = 0; i<tasklist.length; i++) {
    if (tasklist[i].taskID===id) {
      tasklist[i].complete = true;
      tasklist[i].completeDate = new Date();
      pos = i;
      break;
    }
  }
  checkbox.parentElement.parentElement.getElementsByClassName("completed-date")[0].innerHTML = `Date Completed: ${tasklist[pos].completeDate.getDate()}/${tasklist[pos].completeDate.getMonth()+1}/${(tasklist[pos].completeDate.getFullYear()+'').slice(2)}`;
}

/** 
* Same as above, but, y'know, the opposite.
*/
function uncompleteTask(checkbox) {
  checkbox.classList.remove('active');
  checkbox.setAttribute('onclick', 'completeTask(this)');
  let id = checkbox.parentElement.parentElement.id.substring(4);
  let pos = 0;
  for (let i = 0; i<tasklist.length; i++) {
    if (tasklist[i].taskID===id) {
      tasklist[i].complete = false;
      tasklist[i].completeDate = new Date(1970,0,1);
      pos = i;
      break;
    }
  }
  checkbox.parentElement.parentElement.getElementsByClassName("completed-date")[0].innerHTML = "Date Completed: Task is not marked as completed.";
}

function deleteTaskWithID(id) {
  for (let i = 0; i<tasklist.length; i++) {
    if (tasklist[i].taskID===id) {
      tasklist.splice(i,1);
      console.log('Deleted');
      console.log(tasklist);
      renderTasks();
      break;
    }
    console.log('No task found with id: ' + id);
    useDelete = true;
    renderTasks();
  }
}

function getEncodeMap() {
  let keys = new Map();
  keys.set("9", "00");
  keys.set("p", "01");
  keys.set("7", "02");
  keys.set("r", "03");
  keys.set("a", "04");
  keys.set("w", "05");
  keys.set("y", "06");
  keys.set("b", "07");
  keys.set(",", "08");
  keys.set("v", "09");
  keys.set("i", "10");
  keys.set("e", "11");
  keys.set("s", "12");
  keys.set("k", "13");
  keys.set("u", "14");
  keys.set("x", "15");
  keys.set("h", "16");
  keys.set("d", "17");
  keys.set("R", "18");
  keys.set("Y", "19");
  keys.set("T", "20");
  keys.set("K", "21");
  keys.set("n", "22");
  keys.set("8", "23");
  keys.set("z", "24");
  keys.set("t", "25");
  keys.set("f", "26");
  keys.set("0", "27");
  keys.set("H", "28");
  keys.set("M", "29");
  keys.set("F", "30");
  keys.set("G", "31");
  keys.set("N", "32");
  keys.set("D", "33");
  keys.set("C", "34");
  keys.set("B", "35");
  keys.set("J", "36");
  keys.set("P", "37");
  keys.set("O", "38");
  keys.set("I", "39");
  keys.set("U", "40");
  keys.set("E", "41");
  keys.set("W", "42");
  keys.set("Q", "43");
  keys.set("A", "44");
  keys.set("S", "45");
  keys.set("L", "46");
  keys.set("V", "47");
  keys.set("X", "48");
  keys.set("Z", "49");
  keys.set("6", "50");
  keys.set("4", "51");
  keys.set("3", "52");
  keys.set("/", "53");
  keys.set("'", "54");
  keys.set(";", "55");
  keys.set("l", "56");
  keys.set("]", "57");
  keys.set("[", "58");
  keys.set("o", "59");
  keys.set("c", "60");
  keys.set("!", "61");
  keys.set("@", "62");
  keys.set("#", "63");
  keys.set("$", "64");
  keys.set("%", "65");
  keys.set("^", "66");
  keys.set("&", "67");
  keys.set("*", "68");
  keys.set("(", "69");
  keys.set(")", "70");
  keys.set("_", "71");
  keys.set("q", "72");
  keys.set("\\", "73");
  keys.set("g", "74");
  keys.set("j", "75");
  keys.set("m", "76");
  keys.set(".", "77");
  keys.set("-", "78");
  keys.set("+", "79");
  keys.set("1", "80");
  keys.set("2", "81");
  keys.set("5", "82");
  keys.set("=", "83");
  keys.set("`", "84");
  keys.set("~", "85");
  keys.set("{", "86");
  keys.set("}", "87");
  keys.set("|", "88");
  keys.set("?", "89");
  keys.set(">", "90");
  keys.set("<", "91");
  keys.set("\"", "92");
  keys.set(":", "93");
  return keys;
}

function getDecodeMap() {
  let keys = new Map();
  keys.set("00", "9");
  keys.set("01", "p");
  keys.set("02", "7");
  keys.set("03", "r");
  keys.set("04", "a");
  keys.set("05", "w");
  keys.set("06", "y");
  keys.set("07", "b");
  keys.set("08", ",");
  keys.set("09", "v");
  keys.set("10", "i");
  keys.set("11", "e");
  keys.set("12", "s");
  keys.set("13", "k");
  keys.set("14", "u");
  keys.set("15", "x");
  keys.set("16", "h");
  keys.set("17", "d");
  keys.set("18", "R");
  keys.set("19", "Y");
  keys.set("20", "T");
  keys.set("21", "K");
  keys.set("22", "n");
  keys.set("23", "8");
  keys.set("24", "z");
  keys.set("25", "t");
  keys.set("26", "f");
  keys.set("27", "0");
  keys.set("28", "H");
  keys.set("29", "M");
  keys.set("30", "F");
  keys.set("31", "G");
  keys.set("32", "N");
  keys.set("33", "D");
  keys.set("34", "C");
  keys.set("35", "B");
  keys.set("36", "J");
  keys.set("37", "P");
  keys.set("38", "O");
  keys.set("39", "I");
  keys.set("40", "U");
  keys.set("41", "E");
  keys.set("42", "W");
  keys.set("43", "Q");
  keys.set("44", "A");
  keys.set("45", "S");
  keys.set("46", "L");
  keys.set("47", "V");
  keys.set("48", "X");
  keys.set("49", "Z");
  keys.set("50", "6");
  keys.set("51", "4");
  keys.set("52", "3");
  keys.set("53", "/");
  keys.set("54", "'");
  keys.set("55", ";");
  keys.set("56", "l");
  keys.set("57", "]");
  keys.set("58", "[");
  keys.set("59", "o");
  keys.set("60", "c");
  keys.set("61", "!");
  keys.set("62", "@");
  keys.set("63", "#");
  keys.set("64", "$");
  keys.set("65", "%");
  keys.set("66", "^");
  keys.set("67", "&");
  keys.set("68", "*");
  keys.set("69", "(");
  keys.set("70", ")");
  keys.set("71", "_");
  keys.set("72", "q");
  keys.set("73", "\\");
  keys.set("74", "g");
  keys.set("75", "j");
  keys.set("76", "m");
  keys.set("77", ".");
  keys.set("78", "-");
  keys.set("79", "+");
  keys.set("80", "1");
  keys.set("81", "2");
  keys.set("82", "5");
  keys.set("83", "=");
  keys.set("84", "`");
  keys.set("85", "~");
  keys.set("86", "{");
  keys.set("87", "}");
  keys.set("88", "|");
  keys.set("89", "?");
  keys.set("90", ">");
  keys.set("91", "<");
  keys.set("92", "\"");
  keys.set("93", ":");
  return keys;
}
