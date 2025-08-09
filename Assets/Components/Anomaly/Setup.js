const paragraphFilter = ["Title", "Index"];
const titleFilter = ["Tags"];


async function CreateTag(table) {

}

async function FileExists(path) {
    try {
        const response = await fetch(path, { method: "HEAD" });
        
        return response.ok;
    } catch {
        return false;
    }
}

function LoadScript(path) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${path}"]`)) {
            resolve();

            return;
        }

        const script = document.createElement("script");
        script.src = path;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${path}`));

        document.body.appendChild(script);
    });
}

function LoadStyle(path, parent) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${path}"]`)) {
            resolve();
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = path;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${path}`));

        parent.appendChild(link);
    });
}

async function Init() {
    try {
        await LoadScript("../../Assets/Scripts/Utilities.js");
        const anomalyTemplate = await FetchHtml("../../Assets/Components/Anomaly/Template.html");

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

        if (await FileExists("./Style.css")) {
            await LoadStyle("./Style.css", iframeDoc.head);
        }

        const observer = new MutationObserver(() => {
            document.querySelectorAll(".Text-Wrap").forEach(WrapText);

            observer.disconnect();
        });

        observer.observe(iframeDoc.body, { childList: true, subtree: true });

        document.documentElement.replaceChild(iframeDoc.head, document.head);
        document.documentElement.replaceChild(iframeDoc.body, document.body);

        iframe.remove();

        ForArray(versions, (i, v) => {
            console.log("Test?", i, v);
        });

        const params = new URLSearchParams(window.location.search);

        if (await FileExists("./Script.js")) {
            await LoadScript("./Script.js");
        }

        if (params.has("Version")) {
            const version = params.get("Version");

            const loadedVersion = await LoadVersion(version);

            if (!loadedVersion) {
                const url = new URL(window.location);
                url.searchParams.delete("Version");

                window.location.href = url.toString();
            }
        } else if (versions.length > 0) {
            LoadVersion(versions[0]);
        }

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
                loadingOverlay.removeEventListener("transitionend", onOverlayFadeEnd);

                loadingOverlay.remove();
            }
        }

        loadingOverlay.addEventListener("transitionend", onOverlayFadeEnd);
    } catch (error) {
        console.error("Init() - error:", error);
    }
}

async function LoadVersion(version) {
    try {
        const fetchedHtml = await FetchHtml(`./Versions/${version}/Document.html`);

        if (await FileExists(`./Versions/${version}/Style.css`)) {
            await LoadStyle(`./Versions/${version}/Style.css`, document.head);
        }

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

        if (await FileExists(`./Versions/${version}/Script.js`)) {
            await LoadScript(`./Versions/${version}/Script.js`);
        }

        console.log("version", version);
        console.log("fetched", typeof fetchedHtml);

        return true;
    } catch (error) {
        console.log("err", error);

        return false;
    }
}

// Initialize the script
Init();