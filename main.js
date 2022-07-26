// We follow a Model - View - Controller pattern
// Limitations: No negative numbers

const MAXDIGITS = 12;
const ERROR = "ERR";

const KEYMAP = {
    43: "+",
    42: "*",
    47: "/",
    45: "-",
    115: "√",
};

const OPERANDS = Object.values(KEYMAP);
const SPECIALS = ["AC", "C", "="];
KEYMAP[97] = "AC";
KEYMAP[99] = "C";

const NUMBERS = [".", "00"];

for (i=0;i<10;i++){
    NUMBERS.push(String(i));
}

KEYMAP[46] = ".";
KEYMAP[61] = "=";

["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach((i) => KEYMAP[48 + Number(i)] = i);

const STATES = {
    enteringfirst: "enteringFirst", // Initial state: first number is being introduced
    enteredOperand: "enteredOperand", // After a binary operand is clicked
    enteringSecond: "enteringSecond", // After the second number is being introduced
    afterOperation: "afterOperation", // After clicking on sqrt or equal and a result is displayed
    error: "error" // After clicking on sqrt or equal and a result is displayed
}


class Model {
    constructor() {
        this.resetModel();
    }

    resetModel() {
        this.state = STATES.enteringfirst;
        this.prevState = STATES.enteringfirst;
        this.firstNumber = "0"; // It contains the first operand always as a string
        this.secondNumber = null; // It contains the second operand always as a string
        this.operand = null;
        this.screenContent = "0";
        this.cUsed = false;
    }
    
    updateModel(code) {
        if (code !== "C") {
            this.cUsed = false;
        }
        if (this.state === STATES.error){
            if (code !== "AC"){
                return;
            }
        }
        if (SPECIALS.includes(code)) {
            switch (code) {
                case "AC":
                    this.resetModel();
                    break;
                case "C": 
                    if (this.cUsed) {
                        return;
                    }
                    this.cUsed = true;
                    switch (this.state){
                        case STATES.enteringfirst:
                            this.firstNumber = deleteDigit(this.firstNumber);
                            break;
                        case STATES.enteringSecond:
                            this.secondNumber = deleteDigit(this.secondNumber);
                            break;
                        case STATES.afterOperation:
                            this.resetModel();
                            break;
                        case STATES.error:
                            this.resetModel();
                            break;
                        case STATES.enteredOperand:
                            this.state = this.prevState;
                            break;
                    }
                    break;
                case "=":
                    if (this.state === STATES.enteringSecond){
                        let result = computeResultBinaryOp(Number(this.firstNumber), Number(this.secondNumber), this.operand);
                        if (result === ERROR){
                            this.state = STATES.error;
                        } else {
                            this.state = STATES.afterOperation;
                            this.firstNumber = result;
                        }
                    }
                    break;
            }
        } else if (OPERANDS.includes(code)) {
            switch (code){
                case "√":
                    let result = root(Number(this.firstNumber));
                    if (result === ERROR){
                        this.state = STATES.error;
                    } else {
                        this.state = STATES.afterOperation;
                        this.firstNumber = result;
                    }
                    break;
                default:
                    if (this.state === STATES.enteringSecond){
                        let result = computeResultBinaryOp(Number(this.firstNumber), Number(this.secondNumber), this.operand);
                        if (result === ERROR){
                            this.state = STATES.error;
                        } else {
                            this.state = STATES.enteredOperand;
                            this.operand = code;
                            this.firstNumber = result;
                        }
                    } else{
                        this.state = STATES.enteredOperand;
                        this.operand = code;
                    }
                    break;
            }
        } else if (NUMBERS.includes(code)) {
            // It's a number, including 00 or comma
            switch (this.state) {
                case STATES.enteredOperand:
                    this.state = STATES.enteringSecond;
                    this.secondNumber = updateNumber("0", code);
                    break;
                case STATES.afterOperation:
                    this.resetModel();
                    this.firstNumber = updateNumber("0", code);
                    break;
                case STATES.enteringfirst:
                    this.firstNumber = updateNumber(this.firstNumber, code);
                    break;
                case STATES.enteringSecond:
                    this.secondNumber = updateNumber(this.secondNumber, code);
                    break;
            }
        }
        this.updateScreenContent();
    }
    
    updateState(newState){
        this.prevState = this.state;
        this.state = newState;
    }
    
    updateScreenContent(){
        switch(this.state){
            case STATES.afterOperation:
                this.screenContent = this.firstNumber;
                break;
            case STATES.enteredOperand:
                this.screenContent = this.firstNumber;
                break;
            case STATES.enteringSecond:
                this.screenContent = this.secondNumber;
                break;
            case STATES.enteringfirst:
                this.screenContent = this.firstNumber;
                break;
            case STATES.error:
                this.screenContent = ERROR;
                break;
        }
    }
}

const model = new Model();

const screen = document.querySelector("#screen");
const buttons = Array.from(document.querySelectorAll("button"));

function round(number){
    let a = String(number);
    if (a.length <= MAXDIGITS){
        return a;
    } else{
        if (a.includes(".")){
            let first = a.split(".")[0];
            let second = a.split(".")[1];
            if (first.length <= MAXDIGITS){
                let extra = MAXDIGITS - first.length - 1;
                if (extra >= 1){
                    return first + '.' + second.slice(0, extra);
                } else{
                    return first;
                }
            } else {
                return ERROR;
            }
        } else {
            return ERROR;
        }
    }
}

function add(a, b) {
    return round(a + b);
};

function substract(a, b) {
    if (a < b) {
        return ERROR;
    }
    return round(a - b);
};


function multiply(a, b) {
    return round(a * b);
};

function divide(a, b) {
    if (b === 0){
        return ERROR;
    }
    return round(a / b);
};

function root(a) {
    return round(Math.sqrt(a));
}

function updateView() {
    screen.textContent = model.screenContent;
}

function computeResultBinaryOp(a, b, operand){
    switch (operand){
        case "+":
            return add(a, b);
        case "/":
            return divide(a, b);
        case "*":
            return multiply(a, b);
        case "-":
            return substract(a, b);
    }
}

function deleteDigit(number){
    if (number === "0") {
        return;
    } else{
        return number.slice(0, -1);
    }
}

function updateNumber(oldNumber, code){
    // Both oldNumber and code are strings
    if (oldNumber.length == MAXDIGITS) {
        return oldNumber;
    }
    if ((code === "0" || code === "00") && oldNumber === "0") {
        return oldNumber;
    } else if (code === "." && oldNumber.includes(".")) {
        return oldNumber;
    } else {
        if (oldNumber === "0" && code !== ".") {
            return code;
        } else {
            return oldNumber + code
        }
    }
}

function keyEvent(event) {
    if (event.keyCode in KEYMAP) {
        model.updateModel(KEYMAP[event.keyCode]);
        updateView();
    } else {
        return;
    }
}

document.addEventListener("keypress", keyEvent);
buttons.forEach((b) => b.addEventListener("click", buttonEvent));

function translateButton(buttonType, buttonInd){
    switch (buttonType){
        case "n":
            if (buttonInd === "C"){
                return ".";
            }
            break;
        case "o":
            switch (buttonInd) {
                case "A":
                    return "+";
                case "S":
                    return "-";
                case "M":
                    return "*";
                case "R":
                    return "√";
                case "D":
                    return "/";
            }
            break;
        case "s":
            if (buttonInd === "E") {
                return "=";
            }
            break;
    }
    return buttonInd;
}

function buttonEvent(event) {
    let buttonId = event.target.id;
    let buttonType = buttonId[0];
    let buttonInd = buttonId.slice(1);
    model.updateModel(translateButton(buttonType, buttonInd));
    updateView();
}

