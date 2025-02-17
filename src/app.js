"use strict";
import "./css/style.css";
import { d2Get } from "./js/d2api.js";

const tools_repos = [
    "dhis2/tool-dashboard-pruner",
    "dhis2/tool-translation-deduplicator",
    "dhis2/tool-prv-validator",
    "dhis2/tool-whitespace-remover",
    "dhis2/user-role-aggregator",
    "dhis2/tool-option-sorter",
    "dhis2/tool-category-dimension-disabler",
    "dhis2/tool-deprecated-authorities"
];

var latest_releases = [];
var installed_apps = [];
async function fetchGitHubReleases(repo) {
    var res = await fetch(`https://api.github.com/repos/${repo}/releases`);
    var data = await res.json();
    return data;
}

async function fetchToolName(repo){

    const repo_contents_res = await fetch(`https://api.github.com/repos/${repo}/contents`);
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


async function getLatestToolReleases() {
    const releases = await Promise.all(tools_repos.map(async repo => {
        const release_info = await fetchGitHubReleases(repo);
        const tool_name = await fetchToolName(repo);
        const latest_release = release_info[0];
        return {
            repo: repo,
            published_at: latest_release.published_at,
            download_url: latest_release.assets[0].browser_download_url,
            name: tool_name.name,
            version: tool_name.version
        };
    }));
    return releases;
}

function renderToolReleases(latest_releases, installed_apps) {
  
    var html = "";
    //Sort the tools by name
    latest_releases.sort((a, b) => a.name.localeCompare(b.name));
    latest_releases.forEach(tool => {
        //Check if the tool is installed
        var installed = installed_apps.find(app => app.key.lowerCase === tool.name.lowerCase);
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
            <p>Published: ${publishedDate}</p>
            <a href="${tool.download_url}">Download</a>
        </div>`;
    });
    document.getElementById("mainView").innerHTML = html;
}


//Render the tool releases on page load

window.getLatestToolReleases = getLatestToolReleases;
window.latest_releases = latest_releases;

document.addEventListener("DOMContentLoaded", async function () {
    installed_apps = await d2Get("/apps");
    latest_releases = await getLatestToolReleases();
    renderToolReleases(latest_releases, installed_apps);
}   );
