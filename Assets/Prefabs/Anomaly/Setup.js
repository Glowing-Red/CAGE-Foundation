const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];

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

        const title = template.dataset.title;
        const versions = JSON.parse(template.dataset.versions);

        const content = document.querySelector("#body").querySelector(".content");
        document.title = `Cage: ${title}`
        document.documentElement.style.setProperty("--header-height", `${headerClone.getBoundingClientRect().height}px`);

        template.remove();
        template = null;

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

async function LoadVersion(version) {
    try {
        const fetchedDocument = await FetchHtml(`./Versions/${version}.html`);

        console.log("version", version);
        console.log("fetched", typeof fetchedDocument);
        console.log("children?", fetchedDocument.content.children);

        return true;
    } catch (error) {
        return false;
    }
}

// Initialize the script
Init();