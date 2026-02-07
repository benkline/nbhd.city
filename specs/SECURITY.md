# Security & Privacy

**Focus:** Authentication, authorization, data protection, privacy
**Last Updated:** 2026-01-10

---

## Authentication

### BlueSky OAuth 2.0

Flow:
1. User clicks "Login with BlueSky"
2. Redirects to BlueSky authorization endpoint
3. User authorizes nbhd.city app
4. BlueSky redirects to callback with authorization code
5. API exchanges code for access token (server-to-server)
6. API creates JWT with BlueSky info
7. Frontend stores JWT in localStorage

**Security:**
- State parameter prevents CSRF attacks
- Client secret never exposed to frontend
- Access token stored in JWT (not exposed)
- HTTPS enforced for all OAuth flows

### JWT Tokens

- **Algorithm:** HS256
- **Signing key:** Random 32-byte key in AWS Secrets Manager
- **Expiration:** 7 days
- **Refresh:** Manual (user re-authenticates)
- **Storage:** localStorage (httpOnly cookies future consideration)

---

## Authorization (RBAC)

### Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **Admin** | Neighborhood | Full management |
| **Member** | Neighborhood | Create sites, update profile |
| **None** | Public | View public info only |

### Permissions Matrix

| Action | Member | Admin |
|--------|--------|-------|
| View public neighborhood | ✅ | ✅ |
| Join/leave neighborhood | ✅ | ✅ |
| View member list | ✅ | ✅ |
| Create static site | ✅ | ✅ |
| Update own profile | ✅ | ✅ |
| Update neighborhood settings | ❌ | ✅ |
| Promote/demote members | ❌ | ✅ |
| Remove members | ❌ | ✅ |
| Delete neighborhood | ❌ | ✅ (creator) |
| Access admin dashboard | ❌ | ✅ |

### Enforcement

Every API endpoint validates:
1. User authenticated (JWT present/valid)
2. User is member of neighborhood
3. User has required role

```python
# Example FastAPI endpoint
@app.put("/api/neighborhoods/{id}/settings")
def update_neighborhood(id: str, settings: dict, current_user = Depends(get_current_user)):
    # Get neighborhood
    nbhd = get_neighborhood(id)

    # Check: Is user a member?
    membership = get_membership(nbhd.id, current_user.did)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")

    # Check: Is user admin?
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Update
    update_neighborhood_settings(nbhd.id, settings)
```

---

## Privacy Controls

### Neighborhood Privacy Levels

**Public (default):**
- Visible in public directory
- Anyone can view details
- Anyone can view member list
- Open join (no approval needed)

**Private (Phase 3):**
- Not listed in public directory
- Requires invite link
- Admin approval for membership
- Hidden member list from non-members

### User Privacy Settings

- **Email visibility:** Private by default (only visible to admins)
- **Profile visibility:** Public (name, avatar, bio)
- **Activity visibility:** Future (private by default)

---

## Data Protection

### Encryption at Rest

- **DynamoDB:** Encryption enabled (AWS managed keys)
- **S3:** Encryption enabled (AWS managed keys)
- **Secrets:** AWS Secrets Manager (KMS encrypted)

### Encryption in Transit

- **HTTPS/TLS 1.2+** enforced
- Certificate: AWS Certificate Manager (free)
- Automatic renewal

### API Key Security

- Never logged or displayed
- Stored hashed in Secrets Manager
- Rotated regularly
- Rate limited per key

---

## Rate Limiting

### Global Rate Limits

```
100 requests per IP per minute
1000 requests per authenticated user per hour
```

### Feature-Specific Limits

- **Neighborhood creation:** 5 per user per day
- **Site builds:** 10 per user per hour
- **Profile updates:** 20 per user per hour
- **File uploads:** 100 MB per site

### Implementation

```python
# Using slowapi library
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/neighborhoods")
@limiter.limit("5/day")
def create_neighborhood(data: dict, current_user = Depends(get_current_user)):
    # Create neighborhood
    pass
```

---

## Email Verification

### Requirement

On **hosted nbhd.city:** Email must be verified before creating neighborhoods
**Self-hosted:** No verification required

### Flow

1. User enters email
2. API sends verification email with 24-hour token
3. User clicks link
4. Token validated and email marked as verified

---

## GDPR Compliance

### Right to Access

Users can download all their data:

```
GET /api/user/export/data
```

Returns ZIP with:
- Profile information
- All sites and configurations
- Membership history
- Activities

### Right to Erasure

Users can delete their account:

```
DELETE /api/user
```

What happens:
- User profile deleted immediately
- Sites kept for 7 days (user can export)
- Sites deleted after grace period
- Membership records anonymized
- Email records deleted

### Right to Portability

Data exported in standard formats:

- User profile: JSON
- Sites: HTML/CSS/JS static files
- Data: AT Protocol format (Phase 2)

### Right to Rectification

Users can update:
- Display name, bio, location
- Profile visibility settings
- Email address

---

## Abuse Prevention

### Input Validation

All user input validated:
- XSS prevention (HTML escaping)
- SQL injection prevention (parameterized queries)
- Command injection prevention (no shell execution)
- CSRF tokens on form submissions

### Content Moderation (Future)

Phase 3+ will add:
- Spam detection
- Inappropriate content flagging
- User reporting system
- Admin moderation tools

### Account Suspension

Admins can suspend accounts for:
- Terms of service violation
- Spam
- Harassment
- Security compromise

---

## Incident Response

### Security Issues

**Report to:** security@nbhd.city

**Response time:**
- Critical: 24 hours
- High: 48 hours
- Medium: 1 week

### Breach Notification

If user data compromised:
1. Investigate and contain
2. Notify affected users within 72 hours
3. Inform authorities if required
4. Public transparency report

---

## Dependencies & Vulnerability Management

### Regular Audits

```bash
# Python
pip audit

# Node.js
npm audit
```

### Automated Updates

- Dependabot enabled for GitHub
- Critical patches applied immediately
- Regular dependency updates (monthly)

---

## Security Checklist

Before deploying to production:

- [ ] All API endpoints require authentication
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Database encryption enabled
- [ ] CloudFront HTTPS only
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] Security headers set (HSTS, X-Frame-Options, etc)
- [ ] Logging and monitoring enabled
- [ ] Dependencies audited for vulnerabilities

---

## See Also

- [API.md](./API.md) - API authentication
- [DATABASE.md](./DATABASE.md) - Data models
