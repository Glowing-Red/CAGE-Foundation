const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];


async function CreateTag(table) {

}

function FetchTemplate() {
    return fetch("../../Prefabs/Anomaly/Template.html").then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }

        return response.text();
    });
}

async function Init() {
    try {
        const anomalyTemplate = await FetchTemplate();

        const parser = new DOMParser();
        const anomalyDoc = parser.parseFromString(anomalyTemplate, "text/html");

        var template = document.querySelector('#anomaly-template');

        const title = template.dataset.title;
        const versions = JSON.parse(template.dataset.versions);

        template.remove();
        template = null;

        await LoadDocument(anomalyDoc.head, document.head);
        await LoadDocument(anomalyDoc.body, document.body);

        const headerPrefab = await FetchPrefab("Header");
        const headerPrefabDoc = parser.parseFromString(headerPrefab, "text/html");
        const header = headerPrefabDoc.querySelector("template").content.querySelector('.header');
        
        document.body.insertBefore(header, document.body.firstChild);
        document.body.insertBefore(document.querySelector("#body"), header.nextSibling);
        
        document.title = `Cage: ${title}`
        document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);

        ForArray(versions, (i, v) => {
            console.log("Test?", i, v);
        });

        const params = new URLSearchParams(window.location.search);

        if (params.has("Version")) {
            const version = params.get("Version");

            const loadedVersion = await LoadVersion(version);
            console.log("loaded?", loadedVersion);

            if (!loadedVersion) {
                const url = new URL(window.location);

                url.searchParams.delete("Version");
                window.history.replaceState({}, '', url);

                if (versions.length > 0) {
                    LoadVersion(versions[0]);
                }
            }
        } else if (versions.length > 0) {
            LoadVersion(versions[0]);
        }

    } catch (error) {
        console.error("Init() - error:", error);
    }
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

async function LoadVersion(version) {
    try {
        const fetchedHtml = await FetchHtml(`./Versions/${version}.html`);
        
        const parser = new DOMParser();

        const content = document.querySelector("#document");
        const parsedHtml = parser.parseFromString(fetchedHtml, "text/html");
        const template = parsedHtml.querySelector("template");

        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }

        while (template.content.firstChild) {
            content.appendChild(template.content.firstChild);
        }
        
        console.log("version", version);
        console.log("fetched", typeof fetchedHtml);

        return true;
    } catch (error) {
        return false;
    }
}

// Initialize the script
Init();