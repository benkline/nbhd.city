# Deployment Checklist

Use this checklist to deploy nbhd.city to AWS.

## Pre-Deployment

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform installed (`terraform version`)
- [ ] Python 3.11+ installed
- [ ] BlueSky OAuth app created (get client ID and secret)
- [ ] Domain name registered (optional, for custom domain)
- [ ] ACM certificate created in us-east-1 (optional, for custom domain)

## Configuration

- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars`
- [ ] Set `jwt_secret_key` (generate: `openssl rand -base64 32`)
- [ ] Set `bluesky_oauth_client_id`
- [ ] Set `bluesky_oauth_client_secret`
- [ ] Set `frontend_url` to your frontend domain
- [ ] Set `bluesky_oauth_redirect_uri` to `https://your-api/auth/callback`
- [ ] Review other variables (memory, timeout, billing mode)

## Initial Deployment

- [ ] `cd devops`
- [ ] `terraform init`
- [ ] `terraform validate`
- [ ] `terraform plan` (review resources)
- [ ] `terraform apply` (type `yes`)
- [ ] Save API Gateway URL from output

## Testing

- [ ] Test health endpoint: `curl https://your-api/health`
- [ ] Test list neighborhoods: `curl https://your-api/api/nbhds`
- [ ] Test OAuth flow (visit `https://your-api/auth/login`)
- [ ] Create test neighborhood (with auth token)
- [ ] Check CloudWatch logs for errors

## Post-Deployment

- [ ] Configure custom domain (if using)
- [ ] Update DNS records to point to API Gateway
- [ ] Update frontend with new API URL
- [ ] Set up CloudWatch alarms for errors and throttling
- [ ] Enable AWS Budget alerts for cost monitoring
- [ ] Document the deployment in team wiki
- [ ] Schedule regular backups/exports (if needed)

## Production Checklist

- [ ] Enable Point-in-Time Recovery for DynamoDB ✓ (enabled by default)
- [ ] Review and tighten IAM policies
- [ ] Enable X-Ray tracing (`enable_xray_tracing = true`)
- [ ] Set up CloudWatch dashboards
- [ ] Configure API Gateway API keys or custom authorizer
- [ ] Enable AWS WAF for API Gateway (if needed)
- [ ] Set up Terraform remote state in S3
- [ ] Enable DynamoDB encryption at rest ✓ (enabled by default)
- [ ] Review and adjust throttling limits
- [ ] Test disaster recovery procedures
- [ ] Document runbooks for common issues

## Cost Optimization

- [ ] Review DynamoDB billing mode (on-demand vs provisioned)
- [ ] Set up auto-scaling for DynamoDB (if using provisioned)
- [ ] Configure log retention periods (default: 14 days)
- [ ] Enable Lambda Insights (optional, adds cost)
- [ ] Review Lambda memory allocation (more memory = faster but more expensive)
- [ ] Set up AWS Budget alerts

## Migration from PostgreSQL

If migrating from existing PostgreSQL database:

- [ ] Export data: `python scripts/export_postgres_data.py`
- [ ] Review exported JSON files
- [ ] Import to DynamoDB: `python scripts/import_to_dynamodb.py`
- [ ] Verify data in DynamoDB
- [ ] Test all API endpoints with migrated data
- [ ] Keep PostgreSQL backup for rollback
- [ ] Update frontend to use new API URL
- [ ] Monitor for 24-48 hours
- [ ] Decommission PostgreSQL after validation

## Rollback Plan

If deployment fails or issues arise:

- [ ] `terraform destroy` to remove all resources
- [ ] Review CloudWatch logs for errors
- [ ] Fix issues in code or configuration
- [ ] Redeploy with `terraform apply`

## Maintenance

Regular maintenance tasks:

- [ ] Weekly: Review CloudWatch logs and metrics
- [ ] Weekly: Check AWS costs
- [ ] Monthly: Update dependencies in `requirements.txt`
- [ ] Monthly: Review and rotate secrets
- [ ] Quarterly: Review IAM policies
- [ ] Quarterly: Load testing
- [ ] Yearly: Disaster recovery testing

---

**Note:** Check `devops/README.md` for detailed instructions on each step.
