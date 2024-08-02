const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];

let content;

async function Init() {
   try {
      const template = await FetchTemplate();
      
      const parser = new DOMParser();
      const templateDoc = parser.parseFromString(template, "text/html");
      
      await LoadDocument(templateDoc.head, document.head);
      await LoadDocument(templateDoc.body, document.body);
      
      content = document.body.querySelector(".content");
      
      const table = await FetchJson();

      const docDiv = Instance("div", {}, content);
      
      if (isValidString(table["Title"])) {
         Instance("h2", {
            "Text": table["Title"]
         }, docDiv);
      } else {
         Instance("h2", {
            "Text": `Anomaly-${table["Index"]}`
         }, docDiv);
      }
      
      Instance("p", {
         "Html": FormatText(`**Title:** ${isValidString(table["Title"]) ? table["Title"] : "[MISSING]"}`)
      }, docDiv);
      Instance("p", {
         "Html": FormatText(`**Index:** #${table["Index"]}`)
      }, docDiv);

      for (const [key, value] of Object.entries(table)) {
         if (IsTable(value)) {
            if (!titleFilter.includes(key)) {
               CreateTitle(value, key);
            }
         } else {
            if (!paragraphFilter.includes(key)) {
               CreateParagraph(key, value);
            }
         }
      }
   } catch (error) {
      console.error("Initialization error:", error);
   }
};

function CreateTag(table) {

}

function CreateParagraph(title, text) {
   const div = Instance("div", {});

   Instance("p", {
      "Html": FormatText(FormatString("**%s:** %s", title, text))
   }, div);

   div.Parent = content;

   return div;
}

function CreateTitle(table, item) {
   const length = GetLength(table);

   if (length <= 1) {
      return;
   }
   
   const titleDiv = Instance("div", {});
   const itemsContainer = Instance("div", {
      "Class": "flex-column",
      "Style": {
         "gap": "15px"
      }
   });
   
   Instance("h2", {
      "Text": length > 2 ? item + "s" : item
   }, titleDiv);

   for (const [key, value] of Object.entries(table)) {
      if (IsTable(value)) {
         const itemDiv = Instance("div", {
            "Style": {
               "marginLeft": "20px"
            }
         });
         const itemContainer = Instance("div", {
            "Class": "flex-column",
            "Style": {
               "marginLeft": "20px",
               "gap": "5px"
            }
         });
         
         Instance("h3", {
            "Text": FormatString(table["Title"], key, value["Title"])
         }, itemDiv);
         
         for (const [key_2, value_2] of Object.entries(value)) {
            if (key_2 !== "Title") {
               if (IsTable(value_2)) {
                  const keyDiv = Instance("div", {}, itemContainer);
                  const container = Instance("div", {
                     "Style": {
                        "marginLeft": "15px"
                     }
                  });
                  
                  Instance("p", {
                     "Html": FormatText(`**${key_2}:**`)
                  }, keyDiv);
                  
                  for (const [key_3, value_3] of Object.entries(value_2)) {
                     Instance("p", {
                        "Html": FormatText(`**${key_3}:** ${value_3}`)
                     }, container);
                  }
                  
                  container.Parent = keyDiv
               } else {
                  Instance("p", {
                     "Html": FormatText(`**${key_2}:** ${value_2}`)
                  }, itemContainer);
               }
            }
         }
         
         itemContainer.Parent = itemDiv;
         itemDiv.Parent = itemsContainer;
      }
   }
   
   itemsContainer.Parent = titleDiv;
   titleDiv.Parent = content;

   return titleDiv;
}

function LoadDocument(sourceDoc, targetDoc) {
   return new Promise((resolve, reject) => {
      targetDoc.innerHTML = sourceDoc.innerHTML;

      const scripts = sourceDoc.querySelectorAll('script');
      let scriptLoadPromises = [];
      
      scripts.forEach(oldScript => {
         const newScript = document.createElement('script');
         newScript.type = oldScript.type ? oldScript.type : 'text/javascript';
   
         if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.async = false;
            
            let scriptPromise = new Promise((resolve, reject) => {
            newScript.onload = resolve;
            newScript.onerror = reject;
            })

            scriptLoadPromises.push(scriptPromise);
            targetDoc.appendChild(newScript);
         } else {
            newScript.textContent = oldScript.innerText;
            targetDoc.appendChild(newScript);
         }
      });
      
      Promise.all(scriptLoadPromises).then(resolve).catch(reject);
   });
}

function FetchTemplate() {
   return fetch("../../Prefabs/Anomaly/Template.html").then(response => {
      if (!response.ok) {
         throw new Error("Network response was not ok " + response.statusText);
      }
      
      return response.text();
   });
}

// Initialize the script
Init();