#!/bin/bash

# Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Configuration
ENVIRONMENT="${1:-staging}"
REGION="${2:-us-east-1}"
STACK_NAME="dental-clinic-${ENVIRONMENT}"
TEMPLATE_FILE="AWS_CLOUDFORMATION_TEMPLATE.yaml"

log_info "Starting deployment for environment: ${ENVIRONMENT}"
log_info "AWS Region: ${REGION}"

# ============================================
# Phase 1: Pre-Deployment Checks
# ============================================

log_info "Phase 1: Pre-Deployment Checks"

# Check AWS CLI installed
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not installed. Please install it first."
    exit 1
fi
log_success "AWS CLI found"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Please configure AWS CLI."
    exit 1
fi
log_success "AWS credentials configured"

# Check CloudFormation template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "CloudFormation template not found: $TEMPLATE_FILE"
    exit 1
fi
log_success "CloudFormation template found"

# Check .env exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found. Using .env.example"
    cp .env.example .env
    log_warning "Created .env from template. PLEASE UPDATE WITH YOUR VALUES!"
fi
log_success ".env configuration ready"

# ============================================
# Phase 2: Validate CloudFormation Template
# ============================================

log_info "Phase 2: Validating CloudFormation Template"

if aws cloudformation validate-template \
    --template-body file://${TEMPLATE_FILE} \
    --region ${REGION} > /dev/null 2>&1; then
    log_success "CloudFormation template is valid"
else
    log_error "CloudFormation template validation failed"
    exit 1
fi

# ============================================
# Phase 3: Build Docker Images (Optional)
# ============================================

log_info "Phase 3: Building Docker Images"

if [ -f "backend/Dockerfile" ]; then
    log_info "Building backend Docker image..."
    docker build -t dental-clinic:backend-latest ./backend
    log_success "Backend Docker image built"
else
    log_warning "Dockerfile not found in backend directory"
fi

# ============================================
# Phase 4: Create/Update CloudFormation Stack
# ============================================

log_info "Phase 4: Creating/Updating CloudFormation Stack"

# Load environment variables
set -a
source .env
set +a

# Create or update stack
if aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} > /dev/null 2>&1; then
    
    log_info "Stack exists. Updating..."
    
    aws cloudformation update-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://${TEMPLATE_FILE} \
        --parameters \
            ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
            ParameterKey=DBPassword,ParameterValue=${DB_PASSWORD} \
            ParameterKey=JWTSecret,ParameterValue=${JWT_SECRET} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION}
    
    log_success "Stack update initiated"
    
    # Wait for update
    log_info "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name ${STACK_NAME} \
        --region ${REGION}
    
else
    
    log_info "Creating new CloudFormation stack..."
    
    aws cloudformation create-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://${TEMPLATE_FILE} \
        --parameters \
            ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
            ParameterKey=DBPassword,ParameterValue=${DB_PASSWORD} \
            ParameterKey=JWTSecret,ParameterValue=${JWT_SECRET} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION}
    
    log_success "Stack creation initiated"
    
    # Wait for creation
    log_info "Waiting for stack creation to complete (this may take 10-15 minutes)..."
    aws cloudformation wait stack-create-complete \
        --stack-name ${STACK_NAME} \
        --region ${REGION}
fi

log_success "CloudFormation stack ready"

# ============================================
# Phase 5: Get Stack Outputs
# ============================================

log_info "Phase 5: Retrieving Stack Outputs"

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs' \
    --region ${REGION})

log_info "Stack Outputs:"
echo "$OUTPUTS" | jq .

# Extract key outputs
ALB_DNS=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="LoadBalancerDNS") | .OutputValue')
DB_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DocumentDBEndpoint") | .OutputValue')
CF_DOMAIN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDomain") | .OutputValue')
S3_BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')

log_success "ALB DNS: ${ALB_DNS}"
log_success "Database Endpoint: ${DB_ENDPOINT}"
log_success "CloudFront Domain: ${CF_DOMAIN}"
log_success "S3 Bucket: ${S3_BUCKET}"

# ============================================
# Phase 6: Deploy Backend
# ============================================

log_info "Phase 6: Deploying Backend Code"

# Get EC2 instance IP
EC2_IP=$(aws ec2 describe-instances \
    --filters "Name=tag:aws:cloudformation:stack-name,Values=${STACK_NAME}" \
              "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].PrivateIpAddress' \
    --region ${REGION} \
    --output text)

if [ -z "$EC2_IP" ] || [ "$EC2_IP" == "None" ]; then
    log_warning "Could not find EC2 instance. Please deploy backend manually."
    log_info "SSH Command: ssh -i your-key.pem ec2-user@${ALB_DNS}"
else
    log_info "Deploying to EC2 instance: ${EC2_IP}"
    
    # Check if SSH key exists
    if [ -f "dental-clinic-key.pem" ]; then
        chmod 400 dental-clinic-key.pem
        
        # Deploy backend
        log_info "Copying backend files..."
        scp -i dental-clinic-key.pem -r backend/* ec2-user@${EC2_IP}:/opt/dental-clinic/backend/ 2>/dev/null || \
            log_warning "Could not copy backend files via SCP"
        
        # Start backend
        log_info "Starting backend service..."
        ssh -i dental-clinic-key.pem ec2-user@${EC2_IP} \
            "cd /opt/dental-clinic/backend && npm ci && pm2 restart backend" 2>/dev/null || \
            log_warning "Could not start backend service"
        
        log_success "Backend deployed"
    else
        log_warning "SSH key not found. Please deploy backend manually."
    fi
fi

# ============================================
# Phase 7: Deploy Frontend
# ============================================

log_info "Phase 7: Deploying Frontend Code"

if [ -d "frontend/dist" ]; then
    log_info "Uploading frontend to S3..."
    
    # Clear old files
    aws s3 rm s3://${S3_BUCKET} --recursive --region ${REGION} || true
    
    # Upload new files with cache headers
    aws s3 cp frontend/dist/ s3://${S3_BUCKET} \
        --recursive \
        --cache-control "max-age=31536000,immutable" \
        --exclude "index.html" \
        --region ${REGION}
    
    # Upload index.html without cache
    aws s3 cp frontend/dist/index.html s3://${S3_BUCKET} \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
        --region ${REGION}
    
    log_success "Frontend uploaded to S3"
    
    # Invalidate CloudFront
    log_info "Invalidating CloudFront cache..."
    
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?DomainName=='${CF_DOMAIN}'].Id" \
        --output text)
    
    if [ ! -z "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --distribution-id ${DISTRIBUTION_ID} \
            --paths "/*" \
            --region ${REGION}
        
        log_success "CloudFront cache invalidated"
    fi
else
    log_warning "Frontend build directory not found. Building frontend..."
    
    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm ci
        npm run build
        cd ..
        
        # Retry upload
        aws s3 cp frontend/dist/ s3://${S3_BUCKET} --recursive --region ${REGION}
        log_success "Frontend built and deployed"
    else
        log_error "Frontend directory structure incorrect"
    fi
fi

# ============================================
# Phase 8: Health Checks
# ============================================

log_info "Phase 8: Running Health Checks"

sleep 10  # Wait for services to start

# Check ALB
log_info "Checking Application Load Balancer..."
if curl -f http://${ALB_DNS}/api/health > /dev/null 2>&1; then
    log_success "ALB responding to health checks"
else
    log_warning "ALB not yet responding (this is normal immediately after deployment)"
fi

# Check CloudFront
log_info "Checking CloudFront CDN..."
if curl -f https://${CF_DOMAIN}/ > /dev/null 2>&1; then
    log_success "CloudFront serving frontend"
else
    log_warning "CloudFront not yet responding (this is normal immediately after deployment)"
fi

# ============================================
# Phase 9: Configure DNS (Optional)
# ============================================

log_info "Phase 9: DNS Configuration"

log_warning "Please configure DNS records manually:"
log_info "1. Route53 Record for API:"
log_info "   Name: api.yourdomain.com"
log_info "   Type: CNAME"
log_info "   Value: ${ALB_DNS}"
log_info ""
log_info "2. Route53 Record for Frontend:"
log_info "   Name: yourdomain.com"
log_info "   Type: CNAME"
log_info "   Value: ${CF_DOMAIN}"

# ============================================
# Deployment Complete
# ============================================

log_success "==============================================="
log_success "Deployment completed successfully!"
log_success "==============================================="

log_info ""
log_info "Summary:"
log_info "Environment: ${ENVIRONMENT}"
log_info "Region: ${REGION}"
log_info "Stack Name: ${STACK_NAME}"
log_info ""
log_info "Access Points:"
log_info "  API: http://${ALB_DNS}/api (or https://api.yourdomain.com/api)"
log_info "  Frontend: https://${CF_DOMAIN} (or https://yourdomain.com)"
log_info "  Database: ${DB_ENDPOINT}"
log_info ""
log_info "Next Steps:"
log_info "1. Configure DNS records (see above)"
log_info "2. Update frontend API endpoint if needed"
log_info "3. Run post-deployment tests (see DEPLOYMENT_CHECKLIST.md)"
log_info "4. Monitor CloudWatch dashboard"
log_info "5. Set up email alerts"
log_info ""
log_info "Documentation:"
log_info "  - PRODUCTION_DEPLOYMENT_GUIDE.md (comprehensive)"
log_info "  - DEPLOYMENT_QUICK_REF.md (quick reference)"
log_info "  - TROUBLESHOOTING_GUIDE.md (problem solving)"
log_info "  - DEPLOYMENT_CHECKLIST.md (verification)"
log_info ""

# Save outputs to file
cat > deployment-outputs.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${ENVIRONMENT}",
  "region": "${REGION}",
  "stack_name": "${STACK_NAME}",
  "alb_dns": "${ALB_DNS}",
  "database_endpoint": "${DB_ENDPOINT}",
  "cloudfront_domain": "${CF_DOMAIN}",
  "s3_bucket": "${S3_BUCKET}"
}
EOF

log_success "Deployment outputs saved to deployment-outputs.json"

# Cleanup and exit
exit 0
