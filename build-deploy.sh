ng build --configuration production
aws s3 sync dist/redi-research-template-web s3://redi-research-web --delete --profile redi
aws cloudfront create-invalidation --distribution-id E2ZW03YBVYQ4U4 --paths "/*" --profile redi
