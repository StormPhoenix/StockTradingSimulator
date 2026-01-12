<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified sections: Technical Standards (added Documentation Standards subsection)
- Added documentation location requirement: doc/ folder at project root
- Templates requiring updates: ✅ all existing templates remain compatible
- Follow-up TODOs: None
-->

# Stock Trade Simulator Constitution

## Core Principles

### I. Frontend-Backend Separation
The application MUST maintain clear separation between frontend (Vue.js) and backend (Node.js) components. Each tier operates independently with well-defined API contracts. Frontend components communicate with backend exclusively through RESTful APIs. No direct database access from frontend code is permitted.

**Rationale**: Ensures scalability, maintainability, and allows independent development and deployment of frontend and backend components.

### II. Real-Time Market Simulation
The simulator MUST provide realistic stock market behavior with real-time price updates, market volatility simulation, and trading session management. Market data updates MUST be pushed to connected clients within 100ms of generation. Historical price patterns and market events MUST be accurately simulated.

**Rationale**: Core value proposition requires authentic trading experience to provide educational and entertainment value to users.

### III. User Experience First
All user interfaces MUST be intuitive, responsive, and accessible across desktop and mobile browsers. Trading actions MUST provide immediate visual feedback. Portfolio updates MUST be reflected in real-time. Error states MUST be clearly communicated with actionable guidance.

**Rationale**: User engagement and learning effectiveness depend on smooth, frustration-free interaction with the trading interface.

### IV. Data Integrity and Consistency
All trading transactions MUST be atomic and consistent. Portfolio balances, stock positions, and transaction history MUST remain synchronized at all times. Database transactions MUST use proper isolation levels to prevent race conditions during concurrent trading operations.

**Rationale**: Financial simulation requires absolute accuracy to maintain user trust and provide meaningful learning outcomes.

### V. Performance and Scalability
The system MUST handle concurrent users efficiently with response times under 200ms for trading operations. WebSocket connections for real-time updates MUST support at least 100 concurrent users per server instance. Database queries MUST be optimized for trading volume calculations and portfolio aggregations.

**Rationale**: Real-time trading simulation becomes unusable with poor performance, and the system must scale to accommodate multiple simultaneous users.

## Technical Standards

### Technology Stack Requirements
- **Frontend**: Vue.js 3+ with JavaScript ES6+, responsive CSS framework
- **Backend**: Node.js 18+ with Express.js framework
- **Database**: PostgreSQL or MongoDB for persistent data storage
- **Real-time Communication**: WebSocket (Socket.io) for market updates
- **Version Control**: Git with feature branch workflow
- **Testing**: Jest for unit testing, Cypress for end-to-end testing

### Code Quality Standards
- All JavaScript code MUST follow ESLint configuration with Airbnb style guide
- Components MUST be modular and reusable where applicable
- API endpoints MUST include input validation and error handling
- Database schemas MUST include proper indexing for trading queries
- All trading logic MUST include comprehensive unit tests

### Documentation Standards
- All project documentation MUST be stored in the `doc/` folder at the project root
- Documentation MUST include API specifications, user guides, and technical architecture
- Code documentation MUST use JSDoc format for JavaScript functions and classes
- README files MUST be maintained for each major component (frontend, backend)
- Documentation MUST be updated concurrently with code changes

### Security Requirements
- User authentication MUST be implemented with secure session management
- API endpoints MUST include rate limiting to prevent abuse
- Input validation MUST prevent SQL injection and XSS attacks
- Sensitive configuration MUST use environment variables
- HTTPS MUST be enforced in production environments

## Development Workflow

### Branch Management
- `main` branch contains production-ready code
- Feature branches follow naming convention: `feature/[issue-number]-[description]`
- All changes MUST go through pull request review process
- No direct commits to main branch are permitted

### Testing Requirements
- New features MUST include unit tests with >80% code coverage
- Trading logic MUST include integration tests for critical paths
- UI components MUST include component tests for user interactions
- End-to-end tests MUST cover complete trading workflows

### Code Review Process
- All pull requests MUST be reviewed by at least one other developer
- Reviews MUST verify code quality, test coverage, and adherence to principles
- Performance impact MUST be assessed for trading-critical components
- Security implications MUST be evaluated for user-facing features

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guidelines. All code changes, architectural decisions, and feature implementations MUST comply with these principles. When conflicts arise between convenience and constitutional requirements, constitutional compliance takes precedence.

### Amendment Process
Constitution amendments require:
1. Written proposal documenting the change rationale
2. Impact assessment on existing codebase and workflows
3. Team consensus through formal review process
4. Version increment following semantic versioning
5. Migration plan for affected components

### Compliance Verification
- All pull requests MUST include constitutional compliance verification
- Code reviews MUST explicitly check adherence to core principles
- Quarterly architecture reviews MUST assess overall constitutional alignment
- Performance benchmarks MUST verify scalability requirements are met

### Exception Handling
Temporary exceptions to constitutional requirements MUST:
- Include explicit justification and time-bound resolution plan
- Be documented in code comments and project documentation
- Receive approval from project maintainers
- Include automated reminders for resolution

**Version**: 1.1.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12