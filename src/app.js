"use strict";
import "./css/style.css";
import { d2Get, d2Delete, d2PostJson } from "./js/d2api.js";

const tools_repos = [
    "dhis2/tool-dashboard-pruner",
    "dhis2/tool-translation-deduplicator",
    "dhis2/tool-prv-validator",
    "dhis2/tool-whitespace-remover",
    "dhis2/user-role-aggregator",
    "dhis2/tool-option-sorter",
    "dhis2/tool-category-dimension-disabler",
    "dhis2/tool-deprecated-authorities",
    "dhis2/tool-box"
];

var latest_releases = [];
var installed_apps = [];

async function fetchGitHubReleases(repo, key) {
    var res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Accept": "application/vnd.github+json"
        }
    });
    var data = await res.json();
    return data;
}

async function fetchToolName(repo, github_key){

    const repo_contents_res = await fetch(`https://api.github.com/repos/${repo}/contents`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${github_key}`,
            "Accept": "application/vnd.github+json"
        }
    });

    var repo_contents = await repo_contents_res.json();
    var package_json = repo_contents.find(file => file.name === "package.json");
    var package_json_file = await fetch(package_json.download_url);
    var package_json_data = await package_json_file.json();
    return {
        repo: repo,
        name: package_json_data["manifest.webapp"].name,
        version: package_json_data.version,
        key: package_json_data.name
    };
}


async function getLatestToolReleases(github_key) {
    const releases = await Promise.all(tools_repos.map(async repo => {
        const release_info = await fetchGitHubReleases(repo, github_key);
        const tool_name = await fetchToolName(repo, github_key);
        const latest_release = release_info[0];
        return {
            repo: repo,
            published_at: latest_release ? latest_release.published_at : "unknown",
            download_url: latest_release && latest_release.assets.length > 0 ? latest_release.assets[0].browser_download_url : "unknown",
            name: tool_name.name || "unknown",
            version: tool_name.version || "unknown"
        };
    }));
    const now = new Date().toISOString();
    return {
        fetched_at: now,
        releases: releases
    };
}

async function getUserDataStoreKey() {
    try {
        const key = await d2Get("/userDataStore/dhis2-toolbox/github-key");
        return key;
    } catch (error)
    {
        console.error("Failed to fetch github key from userDataStore:", error);
        return null;
    }
}

async function  saveLatestReleasesToDataStore(latest_releases) {
    try {
        await d2Delete("/dataStore/dhis2-toolbox/latest_releases");
    } catch (error) {
        console.warn("Failed to delete latest releases from dataStore:", error);
    }
    await d2PostJson("/dataStore/dhis2-toolbox/latest_releases", latest_releases);
}

function renderModalWindowTokenInput() {
    var modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = `<div id="modalContent">
        <h2>Enter your GitHub key to get started</h2>
        <p>Be sure to consult the README for this app. Once you have created
        a GitHub token, paste it here to get started. Your key will be stored
        in the user data store, and only visible to your user.</p>
        <input type="text" id="githubKey" placeholder="Enter your GitHub key">
        <button id="saveKey">Save</button>
    </div>`;
    document.getElementById("saveKey").addEventListener("click", async () => {
        const github_key = document.getElementById("githubKey").value;
        await d2PostJson("/userDataStore/dhis2-toolbox/github-key", github_key);
        window.location.reload();
    });
}

async function testGitHubWorksAuthenticated(github_key) {
    try {
        const res = await fetch("https://api.github.com/", {
            headers: {
                "Authorization": `Bearer ${github_key}`,
                "Accept": "application/vnd.github+json"
            }
        });
        if (res.status === 200) {
            return true;
        } else {
            return false;
        }
    }
    catch (error) {
        console.error("Failed to test GitHub authentication:", error);
        return false;
    }
}


function renderToolReleases(latest_releases, installed_apps) {
    var html = "";
    //Top level button to refresh the releases
    html += "<button id=\"updateReleases\">Update Releases</button>";
    html += "<p> Last updated on:" + new Date(latest_releases.fetched_at).toLocaleDateString(
        "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }
    ) + "</p>";
    html += "<h2>Tool Releases</h2>";

    //Sort the tools by name
    latest_releases.releases.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    latest_releases.releases.forEach(tool => {

        const installed = installed_apps.find(app => app.name.toLowerCase() === tool.name.toLowerCase());
        const publishedDate = new Date(tool.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        html += `<div class="tool-release">
            <h3>${tool.name}</h3>
            <p><a href="https://github.com/${tool.repo}" target="_blank">Github repo<a> </h3>
            <p>Installed version: ${installed ? installed.version : "Not installed"}</p>
            <p>Current Version: ${tool.version}</p>
            <p>Released on: ${publishedDate}</p>
            <a href="${tool.download_url}">Download</a>
        </div>`;
    });
    document.getElementById("mainView").innerHTML = html;
}


//Render the tool releases on page load

window.getLatestToolReleases = getLatestToolReleases;
window.latest_releases = latest_releases;

document.addEventListener("DOMContentLoaded", async function () {
    //Get the users github key
    const github_key = await getUserDataStoreKey();
    //Warn the user if the key is not present
    if (!github_key) {
        renderModalWindowTokenInput();
    } else {

        //Check if the key is valid
        const github_key_valid = await testGitHubWorksAuthenticated(github_key);
        if (!github_key_valid) {
            alert("The GitHub key you have entered is invalid. Please enter a valid key.");
            renderModalWindowTokenInput();
            return;
        }
        installed_apps = await d2Get("/apps");
        //Check if the latest releases are already stored in the dataStore
        try {
            latest_releases = await d2Get("/dataStore/dhis2-toolbox/latest_releases");
        } catch (error) {
            console.error("Failed to fetch latest releases from dataStore:", error);
            latest_releases = null;
        }

        if (!latest_releases) {
            latest_releases = await getLatestToolReleases(github_key);
            await saveLatestReleasesToDataStore(latest_releases);
        }
        renderToolReleases(latest_releases, installed_apps);
        //Render button to update the datastore with latest releases
        document.getElementById("updateReleases").addEventListener("click", async () => {
            installed_apps = await d2Get("/apps");
            latest_releases = await getLatestToolReleases(github_key);
            await saveLatestReleasesToDataStore(latest_releases);
            renderToolReleases(latest_releases, installed_apps);
        });

    }

}   );
