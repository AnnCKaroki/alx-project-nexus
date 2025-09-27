# Production Deployment Guide

## 🚀 Your Django backend is now production-ready!

This guide covers the steps to deploy your voting app backend to production.

## 📋 Pre-deployment Checklist

### 1. Environment Setup
Create a `.env` file in your backend directory:

```bash
# Copy the example file
cp .env.example .env
```

Update the `.env` file with your production values:

```bash
# Generate a new secret key using:
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=6+nu$2s%zvj81(f(*mvx)86y2a6te9nv#^rx*8j2py^oxa40he

DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Redis for production caching
REDIS_URL=redis://localhost:6379/1
```

### 2. Install Production Dependencies

```bash
# Activate your virtual environment
source pollenv/bin/activate  # Linux/Mac
# or
.\pollenv\Scripts\activate  # Windows

# Install production requirements
pip install -r requirements.txt
pip install -r requirements-prod.txt
```

### 2.1. Redis Setup (Optional - for better performance)

For optimal performance, install Redis server. See [REDIS_SETUP.md](./REDIS_SETUP.md) for detailed instructions.

**Quick Redis Setup:**
```bash
# Using Docker (easiest)
docker run -d -p 6379:6379 --name redis-voting-app redis:alpine

# Test Redis
docker exec -it redis-voting-app redis-cli ping  # Should return "PONG"
```

**Note:** Your backend works perfectly without Redis using database cache fallback.

### 3. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 4. Security Verification

```bash
# Run Django's deployment security check
python manage.py check --deploy
```

This should now pass all security checks when DEBUG=False and proper environment variables are set.

## 🌐 Deployment Options

### Option 1: Simple VPS Deployment (Digital Ocean, Linode, etc.)

1. **Server Setup**:
   ```bash
   # Install Python, pip, and Redis
   sudo apt update
   sudo apt install python3 python3-pip python3-venv redis-server

   # Clone your repository
   git clone https://github.com/yourusername/voting-app.git
   cd voting-app/backend

   # Create and activate virtual environment
   python3 -m venv pollenv
   source pollenv/bin/activate

   # Install dependencies
   pip install -r requirements.txt -r requirements-prod.txt
   ```

2. **Environment Configuration**:
   ```bash
   # Create .env file with production values
   cp .env.example .env
   # Edit .env with your actual values
   nano .env
   ```

3. **Run with Gunicorn**:
   ```bash
   # Test run
   gunicorn backend.wsgi:application --bind 0.0.0.0:8000

   # For production, use a process manager like systemd
   ```

### Option 2: Platform-as-a-Service (Heroku, Railway, etc.)

1. **Create Procfile**:
   ```
   web: gunicorn backend.wsgi:application --port $PORT
   release: python manage.py migrate
   ```

2. **Set Environment Variables** in your platform's dashboard:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `ALLOWED_HOSTS=yourapp.herokuapp.com`
   - `CORS_ALLOWED_ORIGINS=https://yourfrontend.vercel.app`

3. **Deploy** using your platform's CLI or Git integration.

### Option 3: Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app
   COPY requirements*.txt ./
   RUN pip install -r requirements.txt -r requirements-prod.txt

   COPY . .

   RUN python manage.py collectstatic --noinput

   EXPOSE 8000
   CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
   ```

## 🔒 Production Security Features Implemented

✅ **Environment-based configuration**
- Secure SECRET_KEY management
- Debug mode properly disabled
- ALLOWED_HOSTS validation

✅ **HTTPS Security Headers**
- HSTS enabled
- Secure cookies
- XSS protection
- Content type nosniff

✅ **API Security**
- JWT authentication
- Rate limiting (10 req/min per IP)
- CORS configuration
- Input validation

✅ **Database Security**
- SQL injection protection
- Proper foreign key constraints
- Vote integrity enforcement

## 🧪 Testing Production Setup Locally

```bash
# Set environment variables for testing
export SECRET_KEY="6+nu$2s%zvj81(f(*mvx)86y2a6te9nv#^rx*8j2py^oxa40he"
export DEBUG=False
export ALLOWED_HOSTS="127.0.0.1,localhost"

# Run with production settings
python manage.py check --deploy
python manage.py runserver
```

## 📊 Monitoring and Maintenance

### Health Check Endpoint
Your API root (`/`) serves as a health check endpoint.

### Log Files
- Application logs: `backend/logs/django.log`
- Check regularly for errors and security warnings

### Database Maintenance
```bash
# Regular backup (SQLite)
cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d)

# For PostgreSQL
pg_dump voting_app > backup.sql
```

## 🔄 Updates and Maintenance

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt -r requirements-prod.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart your application server
```

## 🆘 Troubleshooting

### Common Issues:

1. **"ALLOWED_HOSTS" error**:
   - Ensure your domain is in the ALLOWED_HOSTS environment variable

2. **Static files not loading**:
   - Run `python manage.py collectstatic`
   - Configure your web server (nginx/Apache) to serve static files

3. **Database connection errors**:
   - Check DATABASE_URL format
   - Ensure database server is running

4. **CORS errors**:
   - Verify CORS_ALLOWED_ORIGINS includes your frontend domain
   - Use HTTPS in production

Your backend is now production-ready! 🎉
