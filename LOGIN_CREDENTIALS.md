# Login Credentials Reference

## ✅ Working Credentials

### Super Admin Access
- **Username**: `super_admin`
- **Password**: `super_admin876635`
- **Access**: http://localhost:3000/super-admin
- **Status**: ✅ Verified working

### Platform Admins

#### Default Platform
- **Username**: `admin`
- **Password**: `admindefaultplatform`
- **Access**: http://localhost:3000/admin/products

#### Roze Platform
- **Username**: `admin`
- **Password**: `adminrozeplatform`
- **Access**: http://localhost:3000/admin/products?platform=roze

#### Jador Platform
- **Username**: `admin`
- **Password**: `adminjadorplatform`
- **Access**: http://localhost:3000/admin/products?platform=jador

## 🔍 How Login Works

### Platform Detection
The system detects platform from:
1. **Subdomain** (e.g., `roze.localhost:3000` → platform="roze")
2. **URL Parameter** (e.g., `?platform=roze`)
3. **Default** (no platform specified → platform="default")

### Password Pattern
- Format: `admin{platformcode}platform`
- Examples:
  - Default: `admindefaultplatform`
  - Roze: `adminrozeplatform`
  - Jador: `adminjadorplatform`

## 🚨 Common Issues

### Getting 401 Unauthorized?

1. **Wrong credentials**: Double-check username and password
2. **Platform mismatch**: Password must match the platform code
3. **Platform code**: Use exact platform code (lowercase, no spaces)

### For Localhost Testing

**If no platform specified:**
```
Username: admin
Password: admindefaultplatform
```

**For specific platforms:**
Add `?platform=roze` or `?platform=jador` to the URL

## 📝 Quick Test

```bash
# Test Super Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super_admin","password":"super_admin876635"}'

# Test Default Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admindefaultplatform"}'
```

## 🎯 Usage Examples

### Login as Super Admin
1. Go to http://localhost:3000/login
2. Enter: `super_admin` / `super_admin876635`
3. Redirected to /super-admin

### Login as Roze Admin
1. Go to http://localhost:3000/login?platform=roze
2. Enter: `admin` / `adminrozeplatform`
3. Redirected to /admin/products (Roze data only)

### Login as Jador Admin
1. Go to http://localhost:3000/login?platform=jador
2. Enter: `admin` / `adminjadorplatform`
3. Redirected to /admin/products (Jador data only)

