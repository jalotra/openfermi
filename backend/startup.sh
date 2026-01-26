#!/bin/bash -l
# SECRET_ARN="prod-mumbai-java-backend-secrets-manager"
# load_secrets(){
#   echo "SECRET_ARN: ${SECRET_ARN}"
#   echo "ENVIRONMENT: ${ENVIRONMENT:-prod}"

#   if [ "$ENV" == "local" ]; then
#     echo "As ENV is set to local. No environment variables were fetched form aws secret."
#   else
#     SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query 'SecretString' --output text)
#     if [ $? -ne 0 ]; then
#       echo "Error retrieving secret from Secrets Manager."
#       exit 1
#     fi
#     secret_val=$(echo "$SECRET_JSON" | sed -e 's/[{}]//g' -e 's/"//g'  -e 's/,/\n/g')
#     while IFS= read -r pair; do
#       pairs+=("$pair")
#     done <<< "$secret_val"
#     for pair in "${pairs[@]}"; do
#       IFS=':' read -r key value <<< "$pair"
#       if [[ -n "$key" ]]; then
#         export "$key=$value"
#       else
#         echo "Warning: Skipping empty key."
#       fi
#     done
#     echo "Environment variables set from secret: $SECRET_ARN"
#   fi
# }
# load_secrets
echo "hello world"
exec java -jar app.jar
