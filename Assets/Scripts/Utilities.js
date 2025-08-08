function FetchJson(jsonPath) {
    return fetch(jsonPath).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }

        return response.json();
    });
}

function FetchHtml(path) {
    return fetch(path).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }

        return response.text();
    });
}

function FetchPrefab(targetPrefab) {
    return FetchHtml(`../../Assets/Components/${targetPrefab}.html`);
}

function GetTitle(raw) {
    if (IsTable(raw) != true) {
        return "[MISSING]"
    }

    const id = raw.Ids[0];
    if (IsValidString(id) != true) {
        return "[MISSING]"
    }

    const version = raw.History[id];
    if (IsTable(version) != true) {
        return "[MISSING]"
    }

    if (IsValidString(version["Title"]) != true) {
        return "[MISSING]"
    }

    return version["Title"]
}

function FormatString(template, ...values) {
    return template.replace(/%s/g, () => values.shift());
}

function FormatText(text) {
    return new Promise((resolve, reject) => {
        const regex = /\[(.*?)\]\((.*?)\)/g;
        const promises = [];

        let formattedText = text
            .replace(/\*\*\*(.*?)\*\*\*/g, `<span class="italic bold">$1</span>`)
            .replace(/\*\*(.*?)\*\*/g, `<span class="bold">$1</span>`)
            .replace(/\*(.*?)\*/g, `<span class="italic">$1</span>`)
            .replace(/\^\^(.*?)\^\^/g, `<sup>$1</sup>`)
            .replace(/,,(.*?),,/g, `<sub>$1</sub>`)
            .replace(/__(.*?)__/g, `<u>$1</u>`)
            .replace(/--(.*?)--/g, `<del>$1</del>`)
            .replace(/\n(\d+)/g, (_, n) => {
                const num = Number(n);

                return num > 1 ? '<br>'.repeat(num) : '';
            })
            .replace(/\n/g, `<br>`);
        let match;

        while ((match = regex.exec(text)) !== null) {
            const [fullMatch, linkText, href] = match;

            if (linkText === "Anomaly") {
                const url = `../${href}`;

                const promise = FetchJson(`${url}/Document.json`).then(json => {
                    const title = GetTitle(json)

                    if (json) {
                        formattedText = formattedText.replace(fullMatch, `<a href="${`${url}/Anomaly.html`}"><span>${title}</span></a>`);
                    } else {
                        formattedText = formattedText.replace(fullMatch, `<a href=""><span>[MISSING]</span></a>`);
                    }
                }).catch(error => {
                    formattedText = formattedText.replace(fullMatch, `<a href=""><span>[MISSING]</span></a>`);
                    console.error("Error fetching JSON:", error);
                });

                promises.push(promise);
            } else {
                text = text.replace(fullMatch, `<a href="${href}"><span>${linkText}</span></a>`);
            }
        }

        Promise.all(promises).then(() => {
            resolve(formattedText);
        }).catch(reject);
    });
}

function IsTable(item) {
    return Object.prototype.toString.call(item) === "[object Object]";
}

function IsArray(item) {
    return Array.isArray(item);
}

function IsElement(instance) {
    return (instance instanceof HTMLElement);
}

function IsValidString(value) {
    return (typeof value === "string" && value.trim() !== "");
}

function IsNumber(value) {
    if (typeof value === "number" && !isNaN(value)) {
        return true;
    }

    return false;
}

function IsBoolean(value) {
    return typeof value === "boolean";
}

function ToNumber(parameter) {
    const parsed = parseFloat(parameter);

    if (isNaN(parsed)) {
        return NaN;
    }

    return parsed;
}

function ToBoolean(param) {
    if (IsBoolean(param)) {
        return param;
    }

    if (IsValidString(param)) {
        const lowerParam = param.toLowerCase();

        if (lowerParam === "true") {
            return true;
        } else if (lowerParam === "false") {
            return;
        }
    }

    if (IsNumber(ToNumber(param))) {
        if (IsNumber(ToNumber(param)) === 1) {
            return true;
        } else if (IsNumber(ToNumber(param)) === 0) {
            return false;
        }
    }

    return false;
}

function ToString(parameter) {
    return String(parameter);
}

function Wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function GetRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function GetLength(table) {
    return Object.keys(table).length;
}

function GetKeys(table) {
    return Object.keys(table);
}

function ForTable(table, callback) {
    const keys = Object.keys(table);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        callback(key, i, table[key]);
    }
}

function ForArray(array, callback) {
    if (!Array.isArray(array)) {
        throw new TypeError("Expected an array");
    }

    for (let i = 0; i < array.length; i++) {
        callback(i, array[i]);
    }
}

function PropertyConvert(property) {
    const Properties = {
        "Html": "innerHTML",
        "Text": "textContent",
        "Class": "className",
        "Style": "style"
    }

    if (Properties[property] != null) {
        return Properties[property];
    }

    return null;
}

function Instance(Instance, Properties, Parent) {
    const element = document.createElement(Instance);

    for (const [key, value] of Object.entries(Properties)) {
        if (PropertyConvert(key)) {
            if (IsTable(value)) {
                for (const [key_2, value_2] of Object.entries(value)) {
                    element[PropertyConvert(key)][key_2] = value_2;
                }
            } else {
                element[PropertyConvert(key)] = value;
            }
        }
    }

    Object.defineProperty(element, "Parent", {
        get() {
            return this._parent;
        },
        set(newParent) {
            if (this._parent) {
                this._parent.removeChild(this);
            }

            if (newParent) {
                newParent.appendChild(this);
            }

            this._parent = newParent;
        }
    });

    if (Parent) {
        element.Parent = Parent
    }

    return element;
}

function IsOverflow(element) {
    return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

function WrapText(element) {
    if (element.UpdateTextWrap) {
        return;
    }

    const originalFontSize = parseFloat(window.getComputedStyle(element).fontSize);

    function ResizeFontSize() {
        let fontSize = parseFloat(window.getComputedStyle(element).fontSize);

        while (IsOverflow(element) && fontSize > 1) {
            fontSize--;
            element.style.fontSize = `${fontSize}px`;
        }

        while (!IsOverflow(element) && (originalFontSize && fontSize < originalFontSize)) {
            fontSize++;
            element.style.fontSize = `${fontSize}px`;

            if (IsOverflow(element)) {
                fontSize--;
                element.style.fontSize = `${fontSize}px`;

                return;
            }
        }
    }

    ResizeFontSize();

    Object.defineProperty(element, "UpdateTextWrap", {
        value: function () {
            ResizeFontSize();
        }
    });

    const observer = new ResizeObserver(() => {
        ResizeFontSize();
    });

    observer.observe(document.body);
}