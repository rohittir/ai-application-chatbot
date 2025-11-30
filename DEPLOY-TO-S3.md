# AWS S3 Deployment Guide

This guide explains how to use the `deploy-to-s3.sh` script to deploy your React application to AWS S3.

## Prerequisites

1. **AWS Account** - You need an active AWS account
2. **AWS CLI** - Install from [https://aws.amazon.com/cli/](https://aws.amazon.com/cli/)
3. **AWS Credentials** - Configure your AWS credentials using `aws configure`
4. **S3 Bucket** - Create an S3 bucket to host your application
5. **Node.js Build** - Build your React app with `npm run build`

## Installation

### 1. Install AWS CLI

```bash
# macOS with Homebrew
brew install awscli

# Or download from AWS
# https://aws.amazon.com/cli/
```

Verify installation:
```bash
aws --version
```

### 2. Configure AWS Credentials

```bash
aws configure
```

You'll be prompted to enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

**Security Note**: Store your credentials securely. Never commit them to version control.

### 3. Create S3 Bucket

```bash
# Create a bucket (bucket names must be globally unique)
aws s3 mb s3://my-ai-form-app --region us-east-1
```

### 4. Configure S3 for Static Website Hosting

```bash
# Enable static website hosting
aws s3api put-bucket-website \
    --bucket my-ai-form-app \
    --website-configuration '{
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }'
```

### 5. Set Bucket Policy for Public Access

```bash
# Create a bucket policy file (bucket-policy.json)
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::my-ai-form-app/*"
        }
    ]
}
EOF

# Apply the policy (replace bucket name)
aws s3api put-bucket-policy \
    --bucket my-ai-form-app \
    --policy file://bucket-policy.json
```

## Usage

### Basic Deployment

```bash
# Build your React app first
npm run build

# Deploy to S3
./deploy-to-s3.sh --bucket my-ai-form-app
```

### With Specific AWS Profile

If you have multiple AWS profiles configured:

```bash
./deploy-to-s3.sh --bucket my-ai-form-app --profile production
```

### With Specific Region

```bash
./deploy-to-s3.sh --bucket my-ai-form-app --region eu-west-1
```

### With CloudFront Distribution

For cache invalidation after deployment:

```bash
./deploy-to-s3.sh --bucket my-ai-form-app --distribution E1234ABCD
```

### Full Example

```bash
./deploy-to-s3.sh \
    --bucket my-ai-form-app \
    --profile production \
    --region us-east-1 \
    --distribution E1234ABCD
```

### Help

```bash
./deploy-to-s3.sh --help
```

## Script Features

✅ **Automatic Versioning** - Static assets get long cache lifetimes
✅ **Smart Caching** - index.html has no-cache policy for always serving fresh HTML
✅ **CloudFront Support** - Optional cache invalidation
✅ **Error Handling** - Comprehensive validation and error messages
✅ **AWS Credential Verification** - Checks credentials before deployment
✅ **Color Output** - Easy-to-read colored status messages
✅ **Bucket Verification** - Ensures bucket exists and is accessible

## Deployment Strategy

The script implements best practices:

1. **Static Assets** - JavaScript, CSS, images get `max-age=31536000` (1 year)
   - These files have content hashes in their names
   - Safe to cache aggressively

2. **index.html** - Gets `max-age=0, must-revalidate`
   - Always fetched from origin
   - Ensures users get the latest version

3. **Exclusions** - Skips:
   - Source maps (*.map files)
   - macOS system files (.DS_Store)

## CloudFront Setup (Optional)

For better performance, set up CloudFront:

```bash
# Create distribution (one-time setup)
aws cloudfront create-distribution \
    --distribution-config file://distribution-config.json
```

Then use the distribution ID for cache invalidation:

```bash
./deploy-to-s3.sh --bucket my-ai-form-app --distribution E1234ABCD
```

## Monitoring

Check deployment status:

```bash
# List bucket contents
aws s3 ls s3://my-ai-form-app --recursive

# Get bucket website URL
aws s3api get-bucket-website --bucket my-ai-form-app

# Check CloudFront invalidation status
aws cloudfront list-invalidations --distribution-id E1234ABCD
```

## Troubleshooting

### "Unable to locate credentials"

```bash
# Configure credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### "Access Denied" Error

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket my-ai-form-app

# Check bucket policy status
aws s3api get-bucket-policy-status --bucket my-ai-form-app
```

### "NoSuchBucket" Error

```bash
# List your buckets
aws s3 ls

# Create the bucket
aws s3 mb s3://my-ai-form-app --region us-east-1
```

### Build Directory Not Found

```bash
# Build the React app first
npm run build

# Then deploy
./deploy-to-s3.sh --bucket my-ai-form-app
```

## Security Best Practices

1. **Never Commit Credentials** - Add to `.gitignore`:
   ```
   .aws/
   .env
   *.key
   ```

2. **Use IAM Roles** - Don't use root account credentials

3. **Enable Versioning** - Protect against accidental deletion:
   ```bash
   aws s3api put-bucket-versioning \
       --bucket my-ai-form-app \
       --versioning-configuration Status=Enabled
   ```

4. **Enable Logging** - Track bucket access:
   ```bash
   aws s3api put-bucket-logging \
       --bucket my-ai-form-app \
       --bucket-logging-status LoggingEnabled={TargetBucket=my-logs-bucket,TargetPrefix=s3-logs/}
   ```

5. **Use HTTPS** - Always access your S3 website via HTTPS (use CloudFront)

## Performance Optimization

### Enable Compression

```bash
aws s3api put-bucket-acl \
    --bucket my-ai-form-app \
    --acl public-read
```

### Add Custom Domain

Use CloudFront with your custom domain via Route 53.

### Enable CDN

```bash
# Create CloudFront distribution pointing to S3 bucket
aws cloudfront create-distribution \
    --distribution-config file://distribution-config.json
```

## Cost Estimation

For a typical React app deployment:

- **S3 Storage**: ~$0.023 per GB/month
- **Data Transfer**: ~$0.085 per GB (first 10TB)
- **CloudFront**: ~$0.085 per GB (first 10TB)

Example: 50MB app with 10k requests/month
- S3 Storage: ~$0.001/month
- CloudFront: ~$0.05/month
- **Total**: ~$0.05/month

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

## Support

For issues or questions:

1. Check AWS CloudTrail logs
2. Review AWS CLI output for detailed error messages
3. Visit AWS Support Center for account-level issues
