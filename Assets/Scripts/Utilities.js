function FetchJson() {
   return fetch("./File.json").then(response => {
      if (!response.ok) {
         throw new Error("Network response was not ok " + response.statusText);
      }
      
      return response.json();
   });
}

function FetchPrefab(targetPrefab) {
   return fetch(`../../Prefabs/${targetPrefab}.html`).then(response => {
      if (!response.ok) {
         throw new Error("Network response was not ok " + response.statusText);
      }
      
      return response.text();
   });
}

function FormatString(template, ...values) {
   return template.replace(/%s/g, () => values.shift());
}

function FormatText(text) {
   let formattedText = text
      .replace(/\*\*\*(.*?)\*\*\*/g, `<span class="italic bold">$1</span>`)
      .replace(/\*\*(.*?)\*\*/g, `<span class="bold">$1</span>`)
      .replace(/\*(.*?)\*/g, `<span class="italic">$1</span>`)
      .replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2"><span>$1</span></a>`)
      .replace(/\^\^(.*?)\^\^/g, `<sup>$1</sup>`)
      .replace(/,,(.*?),,/g, `<sub>$1</sub>`)
      .replace(/__(.*?)__/g, `<u>$1</u>`)
      .replace(/--(.*?)--/g, `<del>$1</del>`)
      .replace(/\n(\d+)/g, (_, n) => {
         const num = Number(n);
         return num > 1 ? '<br>'.repeat(num) : '';
      })
      .replace(/\n/g, `<br>`);
   
   return formattedText;
}

function IsTable(item) {
   return Object.prototype.toString.call(item) === "[object Object]";
}

function isValidString(value) {
   return (typeof value === 'string' && value.trim() !== '' && value !== null);
}

function GetLength(table) {
   return Object.entries(table).length;
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

/*
   for (const [key, value] of Object.entries(table)) {

   }
*/