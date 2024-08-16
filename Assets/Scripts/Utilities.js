function FetchJson(jsonPath) {
   return fetch(jsonPath).then(response => {
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

            const promise = FetchJson(`${url}/File.Json`).then(json => {
               if (json) {
                  if (json["Title"]) {
                     formattedText = formattedText.replace(fullMatch, `<a href="${`${url}/Anomaly.html`}"><span>${json["Title"]}</span></a>`);
                  } else {
                     formattedText = formattedText.replace(fullMatch, `<a href="${`${url}/Anomaly.html`}"><span>${`Anomaly-${href}`}</span></a>`);
                  }
               } else {
                  formattedText = formattedText.replace(fullMatch, `<a href=""><span>[REDACTED]</span></a>`);
               }
           }).catch(error => {
               formattedText = formattedText.replace(fullMatch, `<a href=""><span>[REDACTED]</span></a>`);
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