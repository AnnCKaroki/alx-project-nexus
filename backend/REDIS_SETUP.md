# Redis Setup Guide for Windows

## 🔧 **Redis Installation Options**

Your Django backend is already configured to use Redis for production caching and rate limiting. The Redis Python packages (`redis` and `django-redis`) are already installed in your virtual environment.

### **Option 1: Docker (Recommended - Easiest)**

If you have Docker Desktop installed:

```powershell
# Pull and run Redis container
docker run -d -p 6379:6379 --name redis-voting-app redis:alpine

# Test Redis is working
docker exec -it redis-voting-app redis-cli ping
# Should return "PONG"

# To stop Redis
docker stop redis-voting-app

# To start Redis again
docker start redis-voting-app
```

### **Option 2: Windows Subsystem for Linux (WSL)**

```powershell
# Install WSL (if not already installed)
wsl --install

# After WSL setup, in WSL terminal:
sudo apt update
sudo apt install redis-server

# Start Redis server
sudo service redis-server start

# Test Redis
redis-cli ping
# Should return "PONG"

# To start Redis automatically on WSL startup, add to ~/.bashrc:
echo "sudo service redis-server start" >> ~/.bashrc
```

### **Option 3: Memurai (Redis-compatible for Windows)**

1. Download from: https://www.memurai.com/get-memurai
2. Install the free developer edition
3. Runs as Windows service on port 6379
4. Compatible with all Redis commands

### **Option 4: Redis for Windows (Community)**

1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Keep the terminal open while Redis runs

## 🧪 **Testing Redis Integration**

Once Redis server is running, test the integration:

```powershell
# In your backend directory with activated virtual environment
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ['SECRET_KEY'] = '6+nu\$2s%zvj81(f(*mvx)86y2a6te9nv#^rx*8j2py^oxa40he'
os.environ['DEBUG'] = 'False'
os.environ['ALLOWED_HOSTS'] = '127.0.0.1,localhost'
django.setup()

from django.core.cache import cache
print('Testing Redis cache...')
cache.set('test_key', 'Hello Redis!', 30)
result = cache.get('test_key')
print('Result:', result)
print('✅ Redis working!' if result == 'Hello Redis!' else '❌ Redis failed')
"
```

## ⚙️ **Current Backend Configuration**

Your Django settings are already configured with:

✅ **Smart Cache Fallback:**
- **Production + Redis available:** Uses Redis for optimal performance
- **Production + Redis unavailable:** Falls back to database cache
- **Development:** Uses in-memory cache

✅ **Rate Limiting:**
- 10 requests per minute per IP for voting endpoints
- Uses cache backend (Redis or database)

✅ **Environment Variables:**
```env
# Optional Redis URL (defaults to redis://localhost:6379/1)
REDIS_URL=redis://localhost:6379/1
```

## 🚀 **Production Benefits of Redis**

With Redis running, you get:

- **🏃 Faster rate limiting** - Redis operations vs database queries
- **⚡ Better performance** - In-memory caching
- **🔄 Distributed caching** - Multiple server instances can share cache
- **📊 Session storage** - Can store user sessions in Redis

## 🔍 **Verify Current Setup**

Check what's currently installed:

```powershell
# In your activated virtual environment
pip list | findstr redis
# Should show: django-redis and redis packages
```

## 🎯 **Next Steps**

1. **For Local Development:**
   - Choose one Redis installation method above
   - Test with the provided Python script
   - Your backend will automatically use Redis when available

2. **For Production:**
   - Most cloud providers offer Redis as a service
   - Set `REDIS_URL` environment variable to your Redis instance
   - Your backend is already configured to use it automatically

## 💡 **No Redis? No Problem!**

Your backend works perfectly without Redis:
- ✅ Rate limiting still works (uses database cache)
- ✅ All features functional
- ✅ Production deployment ready
- ✅ Can add Redis later for performance boost

The fallback system ensures your app runs smoothly with or without Redis!
