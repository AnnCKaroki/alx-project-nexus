
# Voting App - Real-Time Polling Platform

A full-stack online polling platform with JWT authentication, real-time voting, and dynamic visualizations.

## 🏗️ Architecture

**Frontend (Next.js/React)**
- Interactive polling interface with real-time updates
- JWT-based authentication flow
- Dynamic charts and visualizations
- Responsive design for all devices

**Backend (Django REST Framework)**
- RESTful APIs with JWT authentication
- PostgreSQL database with optimized queries
- Token blacklisting and refresh mechanisms
- Comprehensive API documentation

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js, React, TypeScript, TailwindCSS |
| Backend | Django, Django REST Framework, PostgreSQL |
| Authentication | JWT with djangorestframework-simplejwt |
| Database | SQLite (development), PostgreSQL (production) |
| API Documentation | Django REST Framework browsable API |

## 🚀 Quick Start

### Backend Setup

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Activate virtual environment**
   ```bash
   # Windows
   .\pollenv\Scripts\activate

   # macOS/Linux
   source pollenv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser  # Optional: create admin user
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

## 🔐 Authentication System

### JWT Implementation
- **Access Tokens**: 60-minute lifetime for API access
- **Refresh Tokens**: 7-day lifetime with automatic rotation
- **Token Blacklisting**: Secure logout with token invalidation
- **Environment Variables**: Production-ready secret key management

### Authentication Endpoints
```
POST /auth/register/     # User registration
POST /auth/login/        # Login (get JWT tokens)
POST /auth/refresh/      # Refresh access token
POST /auth/verify/       # Verify token validity
POST /auth/logout/       # Logout (blacklist tokens)
GET  /auth/profile/      # Get user profile
```

### Usage Example
```javascript
// Login
const response = await fetch('/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
});

const { access, refresh } = await response.json();

// Use token for authenticated requests
const pollsResponse = await fetch('/polls/api/polls/', {
  headers: {
    'Authorization': `Bearer ${access}`,
    'Content-Type': 'application/json'
  }
});
```

## 📊 API Endpoints

### Polls Management
```
GET    /polls/api/polls/           # List all active polls
POST   /polls/api/polls/           # Create new poll (auth required)
GET    /polls/api/polls/{id}/      # Get poll details
PUT    /polls/api/polls/{id}/      # Update poll (owner only)
DELETE /polls/api/polls/{id}/      # Delete poll (owner only)
GET    /polls/api/polls/{id}/results/ # Get poll results
```

### Voting System
```
POST   /polls/api/votes/          # Cast vote (auth required)
GET    /polls/api/votes/history/  # Get user's voting history
```

### Request/Response Examples

**Create Poll**
```json
POST /polls/api/polls/
{
  "question": "What's your favorite programming language?",
  "description": "Survey for development team",
  "choices": [
    {"text": "Python"},
    {"text": "JavaScript"},
    {"text": "TypeScript"},
    {"text": "Go"}
  ]
}
```

**Cast Vote**
```json
POST /polls/api/votes/
{
  "choice": 1
}
```

## 🛡️ Security Features

### Production Security
- Environment variable configuration for secrets
- HTTPS enforcement in production
- CORS protection with configurable origins
- XSS and CSRF protection
- Secure cookie settings
- HSTS headers for enhanced security

### Permission System
- **IsAuthenticated**: Required for poll creation and voting
- **IsOwnerOrReadOnly**: Poll creators can edit/delete their polls
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation and sanitization

## 📁 Project Structure

```
voting-app/
├── backend/
│   ├── backend/
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # Main URL routing
│   │   └── wsgi.py              # WSGI application
│   ├── polls/
│   │   ├── models.py            # Database models
│   │   ├── serializers.py       # API serializers
│   │   ├── views.py             # API views
│   │   ├── auth_views.py        # Authentication views
│   │   └── urls.py              # Poll app URLs
│   ├── manage.py                # Django CLI
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variables template
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main page
│   │   ├── layout.tsx           # App layout
│   │   └── globals.css          # Global styles
│   ├── package.json             # Node.js dependencies
│   └── next.config.ts           # Next.js configuration
└── README.md                    # Project documentation
```

## 🌐 Environment Configuration

### Development (.env)
```bash
DEBUG=True
SECRET_KEY=django-insecure-your-dev-key
```

### Production (.env)
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DATABASE_URL=postgres://user:password@localhost:5432/voting_app
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend (Django)
1. Set production environment variables
2. Configure PostgreSQL database
3. Collect static files: `python manage.py collectstatic`
4. Run migrations: `python manage.py migrate`
5. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend (Next.js)
1. Build for production: `npm run build`
2. Deploy to Vercel, Netlify, or preferred hosting platform

## 🔧 Development Notes

### Database Models
- **Poll**: Question, description, creator, active status
- **Choice**: Poll options with vote counting
- **Vote**: User votes with duplicate prevention
- **Unique Constraints**: One vote per user per poll

### API Features
- Pagination for large datasets
- Filtering and search capabilities
- Comprehensive error handling
- Request/response logging
- API versioning support

## 📈 Performance Optimizations

- Database query optimization with select_related/prefetch_related
- JWT token caching and validation
- CORS optimization for cross-origin requests
- Efficient serialization for API responses
- Database indexing for frequently queried fields

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m "Add feature description"`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the documentation above
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Include steps to reproduce any bugs
