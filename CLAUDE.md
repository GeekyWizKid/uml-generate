# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a UML diagram generation project designed as a single-page application that serves as a product manager assistance tool. The core functionality involves AI-powered UML diagram generation with local PlantUML rendering.

### Core Functionality

- Users input materials/requirements into a web interface
- AI integration (ChatGPT, Claude, DeepSeek, Kimi) generates structured UML content
- Local PlantUML rendering using Docker-based server
- Display generated PlantUML diagrams including:
  - Interaction diagrams (sequence diagrams)
  - Activity diagrams  
  - State diagrams

### Technology Stack

**Current Implementation:**
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **UML Rendering**: Official PlantUML Docker Server
- **AI Integration**: Multiple API providers
- **Containerization**: Docker Compose

## Architecture

### PlantUML Rendering Architecture

The project uses a local Docker-based PlantUML server with fallback mechanism:

1. **Primary**: Local Docker server (http://localhost:8080)
2. **Fallback**: External PlantUML servers as backup
3. **Frontend**: React component fetches rendered SVG from backend API
4. **Backend**: Express proxy handles PlantUML server communication

Key files:
- `client/src/components/PlantUMLRenderer.jsx` - React rendering component
- `server/index.js:73-100` - Backend PlantUML proxy endpoint
- `docker-compose.yml` - PlantUML server configuration
- `plantuml-server.sh` - Docker management script

### Project Structure

```
/
├── client/           # React frontend (Vite)
├── server/           # Express backend
├── docker-compose.yml
├── plantuml-server.sh
└── project.md        # Detailed requirements specification
```

## Development Commands

### Prerequisites
- **Node.js**: Version 20.19+ or 22.12+ required for Vite
- **Docker**: For local PlantUML server
- Use `nvm use 22.17.1` if encountering version issues

### Common Commands

```bash
# Install all dependencies
npm run install:all

# Start development (requires PlantUML server running)
npm run dev

# Start PlantUML server
./plantuml-server.sh start

# Frontend only
npm run client:dev

# Backend only  
npm run server:dev

# Build production
npm run build

# PlantUML server management
./plantuml-server.sh status|stop|restart|logs|test
```

### Essential Setup Sequence

1. Start PlantUML server: `./plantuml-server.sh start`
2. Install dependencies: `npm run install:all`
3. Start development: `npm run dev`
4. Access: http://localhost:5173 (frontend), http://localhost:3001 (backend)

## AI Integration Pattern

The project follows a specific UML generation pattern outlined in `project.md:3-80`:

### Six-Part Output Structure
1. **Core points & assumptions** - Requirements analysis with placeholders
2. **Interaction diagrams** - Sequence diagrams for main scenarios
3. **Activity diagrams** - Business process flows
4. **State diagrams** - Entity lifecycle management
5. **Placeholder list** - All `<PascalCase>` variables with examples
6. **Iteration suggestions** - Refinement recommendations

### Technical Requirements
- **PlantUML format**: Uses @startuml/@enduml syntax (not Mermaid)
- **Placeholder system**: `<PascalCase>` format like `<UserId>`, `<DataPath>`
- **Naming conventions**: actor/boundary/control/entity or participant
- **Incremental updates**: Support for partial modifications
- **Error handling**: Conflict resolution and reset functionality

## Troubleshooting

### PlantUML Rendering Issues
- **Error**: "Cannot read properties of undefined (reading 'length')"
- **Solution**: Ensure PlantUML server is running: `./plantuml-server.sh status`
- **Fallback**: System automatically tries backup servers

### Node.js Version Issues  
- **Error**: "Vite requires Node.js version 20.19+ or 22.12+"
- **Solution**: Use `nvm use 22.17.1` or newer version
- **Note**: May need explicit PATH export for child processes

### Docker Server Issues
```bash
# Check server status
./plantuml-server.sh status

# View logs
./plantuml-server.sh logs  

# Restart server
./plantuml-server.sh restart

# Test connectivity
./plantuml-server.sh test
```

## Critical Implementation Notes

- **Never use react-plantuml package** - causes deflate errors
- **Always prioritize local PlantUML server** - better performance and reliability
- **Use backend proxy pattern** - avoids CORS issues
- **Implement Error Boundaries** - for React component error handling
- **Multi-server fallback** - ensures rendering reliability

## Development Workflow

When modifying PlantUML rendering:
1. Test with local Docker server first
2. Verify fallback mechanism works
3. Check Error Boundary handling
4. Test with various PlantUML syntax edge cases
5. Ensure proper encoding/decoding of PlantUML content