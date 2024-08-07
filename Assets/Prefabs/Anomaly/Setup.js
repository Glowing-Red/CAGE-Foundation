const paragraphFilter = ["Title", "Index", "Conclusion"];
const titleFilter = ["Tags"];

let content;

async function Init() {
   try {
      const anomalyTemplate = await FetchTemplate();
      
      const parser = new DOMParser();
      const anomalyDoc = parser.parseFromString(anomalyTemplate, "text/html");
      
      await LoadDocument(anomalyDoc.head, document.head);
      await LoadDocument(anomalyDoc.body, document.body);
      
      const headerPrefab = await FetchPrefab("Header");
      const anomalyPrefab = await FetchPrefab("Anomaly");

      const headerPrefabDoc = parser.parseFromString(headerPrefab, "text/html");
      const anomalyPrefabDoc = parser.parseFromString(anomalyPrefab, "text/html");
      
      const headerClone = headerPrefabDoc.querySelector("template").content.cloneNode(true).querySelector('.header');
      const anomalyClone = anomalyPrefabDoc.querySelector("template").content.cloneNode(true).querySelector('.container');
      
      document.body.appendChild(headerClone);
      document.body.appendChild(anomalyClone);
      
      const table = await GetTable();
      
      content = anomalyClone.querySelector(".content");
      document.title = `Cage: Anomaly-${table["Index"]}`
      document.documentElement.style.setProperty("--header-height", `${headerClone.getBoundingClientRect().height}px`);
      
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
         "Html": await FormatText(`**Title:** ${isValidString(table["Title"]) ? table["Title"] : "[MISSING]"}`)
      }, docDiv);
      Instance("p", {
         "Html": await FormatText(`**Index:** #${table["Index"]}`)
      }, docDiv);

      for (const [key, value] of Object.entries(table)) {
         if (IsTable(value)) {
            if (!titleFilter.includes(key)) {
               await CreateTitle(value, key);
            }
         } else {
            if (!paragraphFilter.includes(key)) {
               await CreateParagraph(key, value);
            }
         }
      }
      
      CreateParagraph("Conclusion", table["Conclusion"]);
   } catch (error) {
      console.error("Initialization error:", error);
   }
};

async function CreateTag(table) {

}

async function CreateParagraph(title, text) {
   const div = Instance("div", {});
   
   Instance("p", {
      "Html": await FormatText(FormatString("**%s:** %s", title, text))
   }, div);
   
   div.Parent = content;
   
   return div;
}

async function CreateTitle(table, item) {
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
                     "Html": await FormatText(`**${key_2}:**`)
                  }, keyDiv);
                  
                  for (const [key_3, value_3] of Object.entries(value_2)) {
                     Instance("p", {
                        "Html": await FormatText(`**${key_3}:** ${value_3}`)
                     }, container);
                  }
                  
                  container.Parent = keyDiv
               } else {
                  Instance("p", {
                     "Html": await FormatText(`**${key_2}:** ${value_2}`)
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

function GetTable() {
   return fetch("./File.json").then(response => {
      if (!response.ok) {
         throw new Error("Network response was not ok " + response.statusText);
      }
      
      return response.json();
   });
}

// Initialize the script
Init();