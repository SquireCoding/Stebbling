init();

var http = require("http"); //get hypertext transfer protocol

var url = require("url"); //get url module

var ServerIP = '127.0.0.1', port = '3000'; //i am using port 8080 for the frontend hosting, so 3000 is going to be backend hosting

var Server = http.createServer(function (request , response) {
    console.log("Request recieved: " + request.url + "."); //we got a request!!!!!!!!!!
    let partWeWant = request.url.split("&")[1];
    let respondWith = JSON.stringify([{"Error":"returnValueFellThroughWithoutBeingReassigned"}]);
    if (equals(partWeWant.substring(0,3), '651')) {
        let blank = false;
        if (partWeWant==='6519596'||partWeWant.endsWith('9596')) {
          blank = true;
        }
        let username = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[0]);
        let password = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[1]);
        console.log(username);
        console.log(password);
        let status = "476";
        if (!blank&&accountExists(username,password)&&!(username=="")&&!(password=="")&&!blank&&!username.includes("\\")&&!password.includes("\\")&&!username.includes("/")&&!password.includes("/")&&!username.includes(":")&&!password.includes(":")&&!username.includes("*")&&!password.includes("*")&&!username.includes("|")&&!password.includes("|")&&!username.includes("<")&&!password.includes("<")&&!username.includes(">")&&!password.includes(">")&&!username.includes("\"")&&!password.includes("\"")&&!username.includes("?")&&!password.includes("?")) {
            status="358";
            console.log(`Log in request made with: "${username}, ${password}"`);
        }
        respondWith = JSON.stringify([{"626":{"045":status}}]);
    }
    if (equals(partWeWant.substring(0,3), '845')) {
      let username = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[0]);
      let password = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[1]);
      let status = "476";
      if (accountExists(username,password)) {
          status="358";
          let fs = require('fs');
          fs.rmSync(`Storage/Accounts/${username}`, { recursive: true, force: true });
      }
      respondWith = JSON.stringify([{"094":{"045":status}}]);
    }
    if (equals(partWeWant.substring(0,3),'872')) {
      let blank = false;
      if (partWeWant==='8729596'||partWeWant.endsWith('9596')||partWeWant.startsWith("87295")) {
        blank = true;
      }
      let username = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[0]);
      let password = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[1]);
      let status = "476";
      if (accountExists(username)||username.includes("\\")||password.includes("\\")||username.includes("/")||password.includes("/")||username.includes(":")||password.includes(":")||username.includes("*")||password.includes("*")||username.includes("|")||password.includes("|")||username.includes("<")||password.includes("<")||username.includes(">")||password.includes(">")||username.includes("\"")||password.includes("\"")||username.includes("?")||password.includes("?")) {
        status="456";
      } else {
        console.log(`Account Creation Complete for "${username}, ${password}"`)
        createFolder("Storage/Accounts/"+username);
        createFolder(`Storage/Accounts/${username}/${password}`);
        createFile(`Storage/Accounts/${username}/${password}/tasklist.txt`);
        let rn = new Date();
        let lat = new Date();
        lat.setMonth(lat.getMonth());
        console.log(lat.toISOString());
        writeToFile(`Storage/Accounts/${username}/${password}/tasklist.txt`, taskStorable(`My First Task|This is your first task!|1|false|${rn.toISOString()}|${lat.toISOString()}|${lat.toISOString()}`));
      }
      if (!blank&&!(username=="")&&!(password=="")&&!blank) {
          status="358";
      }
      respondWith = JSON.stringify([{"848":{"045":status}}]);
    }
    if (equals(partWeWant.substring(0,3),'932')) {
      let dater = "";
      let username = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[0]);
      let password = convertToMessage(smart95Split(partWeWant.substring(3).slice(0,-2))[1]);
      let status = "476";
      if (accountExists(username,password)) {
        status="358";
        let tasks = getFileContents(`Storage/Accounts/${username}/${password}/tasklist.txt`);
        for (let i = 0; i<tasks.length; i++) {
          if (i==tasks.length-1) {
            dater+=convertToNumber(tasks[i])+"96";
          } else dater+=convertToNumber(tasks[i])+"95";
        }
      }
      respondWith = JSON.stringify([{"789":{"045":status, "098":dater}}]);
    }
    if (equals(partWeWant.substring(0,3),'165')) {
      let tasks = smart97Split(partWeWant.substring(3))[1];
      let rest = smart97Split(partWeWant.substring(3))[0]+'96';
      let username = convertToMessage(smart95Split(rest.slice(0,-2))[0]+'');
      let password = convertToMessage(smart95Split(rest.slice(0,-2))[1]+'');
      console.log(username + ", " + password + " updated task list.");
      let status = "476";
      if (accountExists(username,password)) {
        status="358";
        let codedTasks = smart95Split(tasks.slice(0,-2));
        let taskss = [];
        for (let i = 0; i<codedTasks.length; i++) {
          taskss.push(convertToMessage(codedTasks[i]+''));
        }
        writeFileContents(`Storage/Accounts/${username}/${password}/tasklist.txt`,taskss);
      }
      respondWith = JSON.stringify([{"878":{"045":status}}]);
    }
    response.end('_getcb(' + respondWith + ')'); // this how we send data back
});

Server.listen(port, ServerIP, function () {
    console.log("Waiting for some input at IPV4: " + ServerIP + " at port " + port + ".");
});

/**
 * this method takes the path of a file and returns that file's line in an array
 * @param {String} f the path of the file to read
 * @returns an array of strings with the lines of the files
 */
function getFileContents(f) {
  let fs = require("fs");
  let dater = fs.readFileSync(f)+'';
  let daterarr = dater.split("\n");
  return daterarr;
}

function smart95Split(seq) {
  let arr = [];
  let lastChop=0;
  for (let i =0; i<seq.length;i+=2) {
    if (seq.charAt(i)==='9'&&seq.charAt(i+1)==='5') {
      arr.push(seq.substring(lastChop,i));
      lastChop=i+2;
    }
  }
  if (lastChop==0) arr = [seq]; else arr.push(seq.substring(lastChop,seq.length));
  return arr;
}

function smart97Split(seq) {
  let arr = [];
  let lastChop=0;
  for (let i =0; i<seq.length;i+=2) {
    if (seq.charAt(i)==='9'&&seq.charAt(i+1)==='7') {
      arr.push(seq.substring(lastChop,i));
      lastChop=i+2;
    }
  }
  if (lastChop==0) arr = [seq]; else arr.push(seq.substring(lastChop,seq.length));
  return arr;
}

function writeFileContents(f, arr) {
  let fs = require("fs");
  fs.writeFileSync(f, arr.join("\n"));
}

function taskStorable(task) {
  return task.replace(/ /g, "^");
}

function init() {
    createFolder("Storage");
    let fs = require('fs');
    if (!fs.existsSync('Storage/Accounts')) {
      createFolder("Storage/Accounts");
      console.log("WARNING: Equilibrium will not work correctly if you do not turn on case sensitivity! This will be different for all OS types, but you can do it on Windows by opening Command Prompt and running \"fsutil.exe file setCaseSensitiveInfo [path]\\Frontend\\Storage\\Accounts enable\". DO NOT ATTEMPT TO HOST EQUILIBRIUM WITHOUT CHANGING THIS!");
    }
}

/** 
* @author Emma <viriju@proton.me>
*/
function accountExists(username) {
    let fs = require('fs');
    return fs.existsSync(`Storage/Accounts/${username}`);
}

/** 
* @author Ben
*/
function accountExists(username,password) {
    let fs = require('fs');
    return fs.existsSync(`Storage/Accounts/${username}/${password}`);
}

/** 
* Appends a string to a file.
* @param {string} file - The path of the file to append the string to
* @param {string} string - The string to append
* @author Emma <viriju@proton.me>
*/
function appendToFile(file, string) {
    if (typeof file === 'string' && typeof string === 'string') {
      const fs = require('fs');
      try {
        appendFileSync(file, string);
      } catch (e) {
        console.error(e);
      }
    } else {
      console.error("appendToFile(file, string) expected type 'string' for both arguments");
    }
}

/** 
* updated to work in js
*/
function createFile(f) {
    let fs = require('fs');
    if (typeof f === 'string'&&!fs.existsSync(f)) {
        fs.appendFile(f, '', (e) => {
          if (e) console.error(e);
          else console.log(`File ${f} was created.`);
        });
    }
}

/** 
* updated
* @author team effort
*/
function createFolder(f) {
    let fs = require('fs');
    if (!fs.existsSync(f)) {
      if (typeof f === 'string') {
        return fs.mkdir(f, function() {
          console.log("Created.");
        });
      }
    }
}

/** 
* @author Ben
*/
function equalsIgnoreCase(string1, string2) {
    if (typeof string1 === 'string' && typeof string2 === 'string') {
      return string1.toUpperCase() === string2.toUpperCase();
    }
}

/** 
* @author Ben
*/
function equals(string1, string2) {
    if (typeof string1 === 'string' && typeof string2 === 'string') {
      return string1 === string2;
    }
}

/** 
* Erases a file's content.
* @author Ben
*/
function eraseFile(f) {
    if (typeof f === 'string') {
      let fs = require('fs');
      fs.writeFileSync(f, '');
      console.log("Erased."); // for testing
    }
}

/**
* Adds an account to the locked accounts file.
* @param {string} username - The username of the account you wish to lock
* @author Emma <viriju@proton.me>
*/
function lockAccount(username) {
    // Stored as 'username.date'
    appendToFile('Storage/Accounts/Locked.txt', `\n${username}.${new Date()}`);
    console.log(`${username} has been locked`);
}

/** 
* Writes to a file.
* @param {string} file - The path of the file
* @param {string} s - The string to be written to the file
* @return {boolean} true (if the operation was successful) or false (if it was unsuccessful)
* @author InJava:Ben
* @author InJavaScript:Emma <viriju@proton.me>
*/
function writeToFile(file, s) {
    if (typeof file === 'string' && typeof s === 'string') {
      let fs = require('fs');
      try {
        fs.writeFileSync(file, s);
        console.log("Written."); // for testing
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    } else {
      console.error("writeToFile(file, s) expected type 'string' for both arguments");
    }
}
/** 
* Removes expired account locks. Very likely to be broken.
* @author Emma <viriju@proton.me>
*/
function updateLockout() {
    const fs = require('fs');
    let locks = {};
    try {
      const fileContent = fs.readFileSync('Storage/Accounts/Locked.txt', 'utf8').split('\n');
      for (let i = 0; i < fileContent.length; i++) {
        // 43,200,000 milliseconds = 12 hours
        let locktime = new Date(Date.parse(fileContent[i].split('.')[1]) + 43200000);
        if (locktime < new Date()) {
          locks.push(fileContent[i]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    let s = '';
    for (let i = 0; i < locks.length; i++) {
      s += locks[i];
      // Prevents parsing errors since we split at \n
      if (i < locks.length - 1) s += '\n';
    }
    writeToFile('Storage/Accounts/Locked.txt', s);
}

function passwordValid(password) {
    return !(
      password.match(' ') ||
      equalsIgnoreCase(password, 'null') ||
      password.match('\n')
    );
  }

function splitStringIntoThing(strin) {
    let arra = [];
    for (let i = 0; i < strin.length; i += 2) arra.push(strin.slice(i, i + 2));
    return arra;
}

function convertToMessage(number) {
    if (typeof number === 'string') {
        let fina = "";
        let arr = splitStringIntoThing(number);
        let keys = getDecodeMap();
        for (let i = 0; i<arr.length; i++) fina+=keys.get(String(arr[i]));
        return fina;
    } else {
        console.error("convertToMessage expected type string");
        console.log(typeof number);
        return "error";
    }
}

function convertToNumber(message) {
    if (typeof message === 'string') {
        let fina = "";
        let arr = Array.from(message);
        let keys = getEncodeMap();
        for (let i = 0; i<arr.length; i++) fina+=keys.get(arr[i]);
        return fina;
    } else {
        console.error("convertToNumber expected type string");
        return "error";
    }
}

function getDecodeMap() {
    let keys = new Map();
    keys.set("00","9");
    keys.set("01","p");
    keys.set("02","7");
    keys.set("03","r");
    keys.set("04","a");
    keys.set("05","w");
    keys.set("06","y");
    keys.set("07","b");
    keys.set("08",",");
    keys.set("09","v");
    keys.set("10","i");
    keys.set("11","e");
    keys.set("12","s");
    keys.set("13","k");
    keys.set("14","u");
    keys.set("15","x");
    keys.set("16","h");
    keys.set("17","d");
    keys.set("18","R");
    keys.set("19","Y");
    keys.set("20","T");
    keys.set("21","K");
    keys.set("22","n");
    keys.set("23","8");
    keys.set("24","z");
    keys.set("25","t");
    keys.set("26","f");
    keys.set("27","0");
    keys.set("28","H");
    keys.set("29","M");
    keys.set("30","F");
    keys.set("31","G");
    keys.set("32","N");
    keys.set("33","D");
    keys.set("34","C");
    keys.set("35","B");
    keys.set("36","J");
    keys.set("37","P");
    keys.set("38","O");
    keys.set("39","I");
    keys.set("40","U");
    keys.set("41","E");
    keys.set("42","W");
    keys.set("43","Q");
    keys.set("44","A");
    keys.set("45","S");
    keys.set("46","L");
    keys.set("47","V");
    keys.set("48","X");
    keys.set("49","Z");
    keys.set("50","6");
    keys.set("51","4");
    keys.set("52","3");
    keys.set("53","/");
    keys.set("54","'");
    keys.set("55",";");
    keys.set("56","l");
    keys.set("57","]");
    keys.set("58","[");
    keys.set("59","o");
    keys.set("60","c");
    keys.set("61","!");
    keys.set("62","@");
    keys.set("63","#");
    keys.set("64","$");
    keys.set("65","%");
    keys.set("66","^");
    keys.set("67","&");
    keys.set("68","*");
    keys.set("69","(");
    keys.set("70",")");
    keys.set("71","_");
    keys.set("72","q");
    keys.set("73","\\");
    keys.set("74","g");
    keys.set("75","j");
    keys.set("76","m");
    keys.set("77",".");
    keys.set("78","-");
    keys.set("79","+");
    keys.set("80","1");
    keys.set("81","2");
    keys.set("82","5");
    keys.set("83","=");
    keys.set("84","`");
    keys.set("85","~");
    keys.set("86","{");
    keys.set("87","}");
    keys.set("88","|");
    keys.set("89","?");
    keys.set("90",">");
    keys.set("91","<");
    keys.set("92","\"");
    keys.set("93",":");
    return keys;
}

function getEncodeMap() {
    let keys = new Map();
    keys.set("9","00");
    keys.set("p","01");
    keys.set("7","02");
    keys.set("r","03");
    keys.set("a","04");
    keys.set("w","05");
    keys.set("y","06");
    keys.set("b","07");
    keys.set(",","08");
    keys.set("v","09");
    keys.set("i","10");
    keys.set("e","11");
    keys.set("s","12");
    keys.set("k","13");
    keys.set("u","14");
    keys.set("x","15");
    keys.set("h","16");
    keys.set("d","17");
    keys.set("R","18");
    keys.set("Y","19");
    keys.set("T","20");
    keys.set("K","21");
    keys.set("n","22");
    keys.set("8","23");
    keys.set("z","24");
    keys.set("t","25");
    keys.set("f","26");
    keys.set("0","27");
    keys.set("H","28");
    keys.set("M","29");
    keys.set("F","30");
    keys.set("G","31");
    keys.set("N","32");
    keys.set("D","33");
    keys.set("C","34");
    keys.set("B","35");
    keys.set("J","36");
    keys.set("P","37");
    keys.set("O","38");
    keys.set("I","39");
    keys.set("U","40");
    keys.set("E","41");
    keys.set("W","42");
    keys.set("Q","43");
    keys.set("A","44");
    keys.set("S","45");
    keys.set("L","46");
    keys.set("V","47");
    keys.set("X","48");
    keys.set("Z","49");
    keys.set("6","50");
    keys.set("4","51");
    keys.set("3","52");
    keys.set("/","53");
    keys.set("'","54");
    keys.set(";","55");
    keys.set("l","56");
    keys.set("]","57");
    keys.set("[","58");
    keys.set("o","59");
    keys.set("c","60");
    keys.set("!","61");
    keys.set("@","62");
    keys.set("#","63");
    keys.set("$","64");
    keys.set("%","65");
    keys.set("^","66");
    keys.set("&","67");
    keys.set("*","68");
    keys.set("(","69");
    keys.set(")","70");
    keys.set("_","71");
    keys.set("q","72");
    keys.set("\\","73");
    keys.set("g","74");
    keys.set("j","75");
    keys.set("m","76");
    keys.set(".","77");
    keys.set("-","78");
    keys.set("+","79");
    keys.set("1","80");
    keys.set("2","81");
    keys.set("5","82");
    keys.set("=","83");
    keys.set("`","84");
    keys.set("~","85");
    keys.set("{","86");
    keys.set("}","87");
    keys.set("|","88");
    keys.set("?","89");
    keys.set(">","90");
    keys.set("<","91");
    keys.set("\"","92");
    keys.set(":","93");
    return keys;
}