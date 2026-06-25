---
type: community
cohesion: 0.25
members: 8
---

# Deployment Infrastructure

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Admin Subdomain DNS + SSL]] - concept - docs/DEPLOY.md
- [[CI Deploy Workflow]] - concept - docs/DEPLOY.md
- [[Docker Compose Prod Stack]] - concept - docs/DEPLOY.md
- [[Doppler prd Secrets]] - concept - docs/DEPLOY.md
- [[First Platform Admin Creation]] - concept - docs/DEPLOY.md
- [[Role-based Landing & Provisioning]] - concept - docs/FEATURES.md
- [[VPS Docker Deployment]] - document - docs/DEPLOY.md
- [[nginx Reverse Proxy]] - concept - docs/DEPLOY.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Deployment_Infrastructure
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Platform Job & Content Pipeline Concepts]]
- 1 edge to [[_COMMUNITY_Feature Catalog (AuthAdmini18n)]]

## Top bridge nodes
- [[VPS Docker Deployment]] - degree 7, connects to 1 community
- [[Role-based Landing & Provisioning]] - degree 2, connects to 1 community