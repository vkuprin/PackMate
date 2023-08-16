# PackMate

PackMate is a package management server

## Features

- **User Authentication**: Securely handles user login and token generation.
- **Package Management**: Allows users to upload, retrieve, and view details of specific packages.
- **Admin User Creation**: Automatically creates an admin user if not present.
- **Secure File Handling**: Utilizes Multer for handling package uploads.
- **Cross-Origin Resource Sharing (CORS)**: Enables cross-origin requests, allowing for broader client compatibility.

## Installation

Follow the steps below to set up PackMate:

1. **Clone the Repository**:
```bash
git clone https://github.com/your-username/PackMate.git
```

2. **Navigate to the Directory**:
```bash
cd PackMate
```

3. **Install the Dependencies**:
```bash
npm install
```

4. **Start the Server**:
```bash
npm start
```
The server will start on port 4269 by default.

## API Endpoints

### Authentication

- **POST `/login`**: Authenticate user and return a token.
- Request Body: `{ "username": "testuser", "password": "password" }`
- Response: Auth token

### Package Management

- **GET `/packages`**: Retrieve a list of all packages.
- Response: Array of packages

- **GET `/packages/:packageName`**: Retrieve details of a specific package.
- Response: Package details or 404 if not found

- **POST `/upload`**: Upload a package file (requires authentication).
- Request: Multipart form with the file
- Response: Status code 200 or 500

## Contributing

Feel free to contribute to PackMate by creating a pull request or opening an issue.