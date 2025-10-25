# Assignment 1 - Personal Website

This is a template repo for ex1.

## How to use this template

First up, you should be using GitHub's template functionality to create your own
code repository using this repository as a starting point.
[See the GitHub documentation on creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).

Once you have created your own repository from this template, you can use Git to
clone the repository to your local machine.

When you have a local copy of your repository, you can proceed with the next
steps in this document.

## Getting Started

Ensure you have a local copy of the repository, and, in your terminal, navigate
to the root of the repository.

### Install the dependencies

The codebase has libraries it depends on to run - these are refered to as
"dependencies". You need to install these dependencies before you can run the
codebase. To install the dependencies, run the following command in your
terminal:

```bash
npm install
```

### Run the development server

The codebase uses a development server to run the code. This is a server that
runs on your local machine, and allows you to view the code in your browser. To
run the development server, run the following command in your terminal:

```bash
npm run dev
```

## View the application in your browser

Once the server is running, you can view the application in your browser. To do
this, open Chrome (or Chromium), and type the following into the address bar:

```bash
http://localhost:3000
```

## Other commands you can run

The codebase is set up with a number of commands you can run. These are defined
in the `package.json` file, in the `scripts` section. The following are
available:

**Lint your code to detect style and some syntax errors**

```bash
npm run lint
```

**Compile a production build of your app**

```bash
npm run build
```

**Run the compiled production build of the server**

```bash
npm run preview
```
