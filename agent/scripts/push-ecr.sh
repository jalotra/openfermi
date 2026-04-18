#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?Set AWS_REGION}"
: "${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
: "${ECR_REPOSITORY:?Set ECR_REPOSITORY}"

TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${TAG}"

aws ecr get-login-password --region "${AWS_REGION}" |
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker build -t "${ECR_REPOSITORY}:${TAG}" .
docker tag "${ECR_REPOSITORY}:${TAG}" "${IMAGE_URI}"
docker push "${IMAGE_URI}"

echo "Pushed ${IMAGE_URI}"
