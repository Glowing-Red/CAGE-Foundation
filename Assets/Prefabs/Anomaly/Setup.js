const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];

let content;

async function Init() {
    try {
        const anomalyTemplate = await FetchTemplate();

        const parser = new DOMParser();
        const anomalyDoc = parser.parseFromString(anomalyTemplate, "text/html");

        var template = document.querySelector('#anomaly-template');
        console.log("template?", template);
        template.remove();

        await LoadDocument(anomalyDoc.head, document.head);
        await LoadDocument(anomalyDoc.body, document.body);

        const headerPrefab = await FetchPrefab("Header");
        const headerPrefabDoc = parser.parseFromString(headerPrefab, "text/html");
        const headerClone = headerPrefabDoc.querySelector("template").content.cloneNode(true).querySelector('.header');

        document.body.appendChild(headerClone);
        document.body.appendChild(template);
        
        const title = template.dataset.title;
        const versions = JSON.parse(template.dataset.versions);

        content = document.querySelector("#body").querySelector(".content");
        document.title = `Cage: ${title}`
        document.documentElement.style.setProperty("--header-height", `${headerClone.getBoundingClientRect().height}px`);
        
        Array.from(template.content.children).forEach(child => {
            child.style.display = "none";
            content.appendChild(child);
        });
        
        template.remove();
        template = null;

        const history = content.querySelector(`[data-version="V${versions[0]}"]`);
        
        if (IsElement(history)) {
            history.style.display = "";
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
};

async function CreateTag(table) {

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