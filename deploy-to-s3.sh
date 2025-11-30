#!/bin/bash

################################################################################
# Deploy Build Files to AWS S3
# This script uploads the React build files to an S3 bucket
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="./build"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    -b, --bucket BUCKET_NAME    S3 bucket name (required)
    -p, --profile PROFILE       AWS profile to use (default: default)
    -r, --region REGION         AWS region (default: us-east-1)
    -d, --distribution DIST_ID  CloudFront distribution ID (optional, for cache invalidation)
    -h, --help                  Show this help message

EXAMPLES:
    # Basic deployment
    $0 --bucket my-app-bucket

    # With specific AWS profile
    $0 --bucket my-app-bucket --profile production

    # With CloudFront invalidation
    $0 --bucket my-app-bucket --distribution E1234ABCD

EOF
}

################################################################################
# Parse Command Line Arguments
################################################################################

S3_BUCKET=""
AWS_PROFILE="default"
AWS_REGION="us-east-1"
CLOUDFRONT_DIST_ID=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--bucket)
            S3_BUCKET="$2"
            shift 2
            ;;
        -p|--profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -d|--distribution)
            CLOUDFRONT_DIST_ID="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

################################################################################
# Validation
################################################################################

if [ -z "$S3_BUCKET" ]; then
    log_error "S3 bucket name is required"
    print_usage
    exit 1
fi

if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build directory not found: $BUILD_DIR"
    echo "Please run 'npm run build' first"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

################################################################################
# Main Deployment Process
################################################################################

log_info "Starting deployment to S3..."
log_info "Bucket: $S3_BUCKET"
log_info "Region: $AWS_REGION"
log_info "Profile: $AWS_PROFILE"
log_info "Build Directory: $BUILD_DIR"

# Verify AWS credentials
log_info "Verifying AWS credentials..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    log_error "Failed to verify AWS credentials for profile: $AWS_PROFILE"
    exit 1
fi
log_success "AWS credentials verified"

# Check if bucket exists
log_info "Checking S3 bucket..."
if ! aws s3 ls "s3://$S3_BUCKET" --profile "$AWS_PROFILE" --region "$AWS_REGION" &> /dev/null; then
    log_error "S3 bucket not found or not accessible: $S3_BUCKET"
    exit 1
fi
log_success "S3 bucket is accessible"

# Upload build files to S3
log_info "Uploading build files to S3..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.map" \
    --exclude ".DS_Store"

log_success "Static assets uploaded with cache control"

# Upload index.html with no cache
log_info "Uploading index.html with no-cache policy..."
aws s3 cp "$BUILD_DIR/index.html" "s3://$S3_BUCKET/index.html" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html; charset=utf-8"

log_success "index.html uploaded with no-cache policy"

# Get S3 website URL
S3_URL="https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com"
log_success "Build files uploaded successfully!"
log_info "S3 URL: $S3_URL"

# Invalidate CloudFront cache if distribution ID provided
if [ -n "$CLOUDFRONT_DIST_ID" ]; then
    log_info "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DIST_ID" \
        --paths "/*" \
        --profile "$AWS_PROFILE" &> /dev/null
    log_success "CloudFront cache invalidation initiated"
fi

# Display deployment summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}            ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  • S3 Bucket: $S3_BUCKET"
echo "  • Region: $AWS_REGION"
echo "  • Profile: $AWS_PROFILE"
echo "  • URL: $S3_URL"
if [ -n "$CLOUDFRONT_DIST_ID" ]; then
    echo "  • CloudFront Distribution: $CLOUDFRONT_DIST_ID"
    echo "  • Cache Invalidation: ✓"
fi
echo ""
echo "📝 Next Steps:"
echo "  1. Configure S3 bucket for static website hosting (if not already done)"
echo "  2. Set appropriate bucket permissions for public access"
echo "  3. Test your deployment at: $S3_URL"
echo ""

log_success "Deployment complete!"
