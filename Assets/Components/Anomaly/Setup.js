const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];


async function CreateTag(table) {

}

function FetchTemplate() {
    return fetch("../../Assets/Components/Anomaly/Template.html").then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }

        return response.text();
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();

            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.body.appendChild(script);
    });
}

async function Init() {
    try {
        await loadScript("../../Assets/Scripts/Utilities.js");

        const anomalyTemplate = await FetchTemplate();
        
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(anomalyTemplate);
        iframeDoc.close();

        const parser = new DOMParser();
        await new Promise((resolve, reject) => {
            iframe.onload = () => resolve();
            iframe.onerror = () => reject(new Error("Iframe failed to load"));
        });

        var template = document.querySelector("#anomaly-template");

        const title = template.dataset.title;
        const versions = JSON.parse(template.dataset.versions);

        const headerPrefab = await FetchPrefab("Header");
        const headerPrefabDoc = parser.parseFromString(headerPrefab, "text/html");
        const header = headerPrefabDoc.querySelector("template").content.querySelector("header");

        iframeDoc.body.insertBefore(header, iframeDoc.body.firstChild);
        iframeDoc.body.insertBefore(iframeDoc.querySelector("#body"), header.nextSibling);

        iframeDoc.title = `Cage: ${title}`

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
                window.history.replaceState({}, "", url);

                if (versions.length > 0) {
                    LoadVersion(versions[0]);
                }
            }
        } else if (versions.length > 0) {
            LoadVersion(versions[0]);
        }

        const observer = new MutationObserver(() => {
            document.querySelectorAll(".Text-Wrap").forEach(WrapText);

            observer.disconnect();
        });

        observer.observe(iframeDoc.body, { childList: true, subtree: true });

        document.documentElement.replaceChild(iframeDoc.head, document.head);
        document.documentElement.replaceChild(iframeDoc.body, document.body);

        iframe.remove();
        
        await Wait(GetRandomNumber(700, 1200));

        const loadingOverlay = document.getElementById("loading-overlay");
        const spinner = loadingOverlay.querySelector(".spinner");

        const transitionTime = 2;
        const style = window.getComputedStyle(spinner);
        const transform = style.getPropertyValue("transform");

        spinner.style.transform = transform;
        spinner.style.animationPlayState = "paused";

        loadingOverlay.style.transition = `opacity ${transitionTime}s ease`;
        spinner.style.transition = `opacity ${(transitionTime / 4)}s ease`;

        spinner.style.opacity = "0";
        loadingOverlay.style.opacity = "0";

        function onOverlayFadeEnd(event) {
            if (event.propertyName === "opacity" && event.target === loadingOverlay) {
                loadingOverlay.remove();
                loadingOverlay.removeEventListener("transitionend", onOverlayFadeEnd);
            }
        }

        loadingOverlay.addEventListener("transitionend", onOverlayFadeEnd);
    } catch (error) {
        console.error("Init() - error:", error);
    }
}

function LoadDocument(sourceDoc, targetDoc) {
    return new Promise((resolve, reject) => {
        targetDoc.innerHTML = sourceDoc.innerHTML;

        const scripts = sourceDoc.querySelectorAll("script");
        let scriptLoadPromises = [];

        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            newScript.type = oldScript.type ? oldScript.type : "text/javascript";

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
        const fetchedHtml = await FetchHtml(`./Versions/${version}/Document.html`);

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