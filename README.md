# APERTURE Intelligence — Additional Functions

Supplementary Netlify Functions for the APERTURE Intelligence platform.

## Functions

### cross-sell.mjs
Industry-aware cross-sell engine. After purchase, recommends relevant UNLESS ecosystem platforms based on report topic/industry.

**Endpoint:** `POST /api/cross-sell`

**Input:**
```json
{
  "email": "user@example.com",
  "reportTopic": "SaaS Analytics",
  "industry": "saas",
  "tier": "professional"
}
```

**Returns:** Platform recommendations with personalized reasons, optionally sends cross-sell email via Resend.

## Integration
These functions extend the existing APERTURE platform (aperture-intel.netlify.app).
