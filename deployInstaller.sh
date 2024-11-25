#!/bin/bash

# Ensure the script stops on any error
set -e

# Define variables
REMOTE_USER="beniben"                      # Username for the Raspberry Pi
REMOTE_IP="192.168.8.44"                  # IP address of the Raspberry Pi
REMOTE_PORT="2233"                        # SSH port on the Raspberry Pi
REMOTE_DIR="/var/www/softwares/installer" # Target directory on Raspberry Pi

# Files to upload
FILES_TO_UPLOAD=(
  "./dist/electron/Packaged/mac/InfinityInstaller.app/Contents/Resources/app.asar"
)

# Path to package.json
PACKAGE_JSON="./package.json"

# Validate package.json exists
if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Error: package.json not found in the current directory."
  exit 1
fi

# Extract version and name from package.json
VERSION=$(grep '"version"' "$PACKAGE_JSON" | head -n 1 | awk -F '"' '{print $4}')
NAME=$(grep '"name"' "$PACKAGE_JSON" | head -n 1 | awk -F '"' '{print $4}')

# Ensure both version and name were extracted successfully
if [ -z "$VERSION" ] || [ -z "$NAME" ]; then
  echo "Error: Failed to extract version or name from package.json."
  exit 1
fi

REMOTE_DIR="$REMOTE_DIR/$VERSION"

# Print deployment information
echo "Deploying files to $REMOTE_USER@$REMOTE_IP:$REMOTE_DIR"
echo "Version: $VERSION"
echo "Name: $NAME"

# Ensure the remote directory exists
echo "Ensuring remote directory exists..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "mkdir -p $REMOTE_DIR"

# Process each file in FILES_TO_UPLOAD
for FILE in "${FILES_TO_UPLOAD[@]}"; do
  if [ -f "$FILE" ]; then
    BASENAME=$(basename "$FILE")
    ZIP_FILE="${FILE}.zip"

    echo "Zipping $FILE into $ZIP_FILE..."
    zip -j "$ZIP_FILE" "$FILE" || { echo "Failed to create zip file for $FILE"; exit 1; }

    echo "Uploading $ZIP_FILE to $REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/${BASENAME}.zip..."
    scp -P "$REMOTE_PORT" "$ZIP_FILE" "$REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/${BASENAME}.zip"

    echo "Removing temporary zip file $ZIP_FILE..."
    rm -f "$ZIP_FILE"
  else
    echo "Error: File $FILE does not exist."
    exit 1
  fi
done

# Create version.yml dynamically and upload it
echo "Generating and uploading version.yml..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "echo \"version: $VERSION\nname: $NAME\" > $REMOTE_DIR/version.yml"

# Deployment completed
echo "Deployment completed successfully!"