#!/bin/bash
set -e
echo "Starting backend with arguments: $@"
exec java -jar app.jar "$@"
