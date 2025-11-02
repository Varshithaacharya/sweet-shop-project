# sweet-shop-project
Sweet Shop Management System (Simple JavaScript Version)

This is a full-stack Sweet Shop Management System built with a Node.js/Express backend and a simple HTML/JavaScript frontend.

This version is designed to be much simpler to set up and understand than a full Java Spring Boot + React application.

Backend: Node.js, Express, JWT, and SQLite (a file-based database).

Frontend: A single HTML file with vanilla JavaScript and Tailwind CSS.

Project Structure

You only need to create this simple structure:

sweet-shop-project/
├── backend/
│   ├── package.json
│   └── server.js
│
└── frontend/
    └── index.html


How to Run This Project in VS Code (Easy Steps)

You'll be up and running in 5 minutes.

Part 1: Run the Backend Server

Create Folders:

Create a main folder named sweet-shop-project.

Inside it, create a folder named backend.

Add Files:

Copy the package.json code I provided into a new file named sweet-shop-project/backend/package.json.

Copy the server.js code I provided into a new file named sweet-shop-project/backend/server.js.

Install Dependencies:

Open a terminal in VS Code (Terminal > New Terminal).

Navigate into your backend folder: cd backend

Run this command to install the necessary packages: npm install

Run the Server:

In that same terminal, run this command: node server.js

You will see a message like Server running on port 3000 and Database initialized.

A new file named sweets.db will be created automatically in your backend folder. This is your database!

The server will also create a default admin user with username admin and password password123.

That's it! The backend is running. Leave this terminal open.

Part 2: Run the Frontend App

Create Folder:

Go back to your sweet-shop-project folder.

Inside it, create a folder named frontend.

Add File:

Copy the index.html code I provided into a new file named sweet-shop-project/frontend/index.html.

Open in Browser:

Right-click the index.html file in your VS Code explorer.

Select "Copy Path".

Open your web browser (like Chrome or Firefox) and paste the path into the address bar.

Hit Enter.

The application will load, and you can now register, log in (as admin/password123), and manage your sweets!

My AI Usage

Which AI tools you used: I (Gemini) was used to generate this entire project structure and code.

How you used them: You asked for a "simpler" version of the Sweet Shop project using JavaScript. I analyzed your request and the original PDF's requirements.

I chose Node.js/Express/SQLite for the backend as the simplest possible stack that still meets the "database" requirement (SQLite is not in-memory).

I chose a single HTML file with vanilla JavaScript and a Tailwind CDN for the frontend to completely eliminate any complex build steps (like React/npm).

I generated the complete, runnable code for server.js (including all API endpoints, auth, and database setup) and index.html (including all client-side logic for auth, fetching, and rendering the UI).

Reflection: This approach shows how AI can rapidly prototype a full-stack application in a different technology stack based on user feedback. By simplifying the stack, the project becomes much more accessible and easier to set up, fulfilling your request for an "easy way" to do this in VS Code.
