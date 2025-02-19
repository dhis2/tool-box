# DHIS2 Admin Toolbox
Basic toolbox for system administrators to perform common tasks in DHIS2.

> **WARNING**
> This tool is intended to be used by system administrators to perform specific tasks, it is not intended for end users. It is available as a DHIS2 app, but has not been through the same rigorous testing as normal core apps. It should be used with care, and always tested in a development environment.

## License
© Copyright University of Oslo 2025

## Features

This app provides you a central place to view tools which have been released for DHIS2 System administrators
by the DHIS2 Global Implementation team. The tools are available as DHIS2 apps, and can be installed in your DHIS2 instance.

You will see a list of tools which are available on GitHub, which versions you have installed on your instance.

Because of limitations with Cross object resource sharing (CORS), it is not possible to install the app directly into your instance. You will need to download the app from GitHub, and install it manually using the App Management App. The DHIS2 Toolbox will provide you with a link to the GitHub repository where you can download the latest versions of all tools.

## Using this app
### Install a GitHub personal access token

To use this app, you need to create a personal access token on GitHub. This is used to access the GitHub API to fetch the latest releases of the DHIS2 apps. Github has a limit on the number of requests that can be made without authentication, so this is necessary to avoid hitting that limit.

Head over to Github and create a new personal access token. You can do this by going to your account settings, then Developer settings, then Personal access tokens. Click on "Generate new token" and give it a name, and select the `repo` scope. Copy the token and save it somewhere safe.

A copy of this key in your `userDataStore` in DHIS2, so that you don't have to enter it every time you use the app. Note that this token is stored in the `userDataStore` in DHIS2, and is only accessible to the current user. It is not shared with other users. If you want to remove the token, you can make a DELETE request to the same endpoint.

## Getting started

### Install dependencies
To install app dependencies:

```
yarn install
```

### Compile to zip
To compile the app to a .zip file that can be installed in DHIS2:

```
yarn run zip
```

### Start dev server
To start the webpack development server:

```
yarn start
```

By default, webpack will start on port 8081, and assumes DHIS2 is running on 
http://localhost:8080/dhis with `admin:district` as the user and password.

A different DHIS2 instance can be used to develop against by adding a `d2auth.json` file like this:

```
{
    "baseUrl": "http://localhost:9000/dev",
    "username": "john_doe",
    "password": "District1!"
}
```

