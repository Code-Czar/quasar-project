#!/bin/bash

# Ensure the script stops on any error
set -e

# Define variables
REMOTE_USER="beniben"                      # Username for the Raspberry Pi
REMOTE_IP="192.168.8.44"                  # IP address of the Raspberry Pi
REMOTE_PORT="2233"                        # SSH port on the Raspberry Pi

# Files to upload
FILES_TO_UPLOAD=(
  "./dist/electron/Packaged/InfinityInstaller-darwin-arm64/InfinityInstaller.app/Contents/Resources/app.asar"
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
REMOTE_DIR="/var/www/softwares/$NAME" # Target directory on Raspberry Pi


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

# Ensure the remote updates directory exists
echo "Ensuring remote updates directory exists..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "mkdir -p $REMOTE_DIR/updates"

# Process each file in FILES_TO_UPLOAD
for FILE in "${FILES_TO_UPLOAD[@]}"; do
  if [ -f "$FILE" ]; then
    BASENAME=$(basename "$FILE")
    ZIP_FILE="${FILE}.zip"

    echo "Zipping $FILE into $ZIP_FILE..."
    zip -j "$ZIP_FILE" "$FILE" || { echo "Failed to create zip file for $FILE"; exit 1; }

    echo "Uploading $ZIP_FILE to $REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/updates/${BASENAME}.zip..."
    scp -P "$REMOTE_PORT" "$ZIP_FILE" "$REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/updates/${BASENAME}.zip"

    echo "Removing temporary zip file $ZIP_FILE..."
    rm -f "$ZIP_FILE"
  else
    echo "Error: File $FILE does not exist."
    exit 1
  fi
done


# Create version.yml dynamically and upload it
echo "Generating and uploading version.yml..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "printf \"version: %s\nname: %s\n\" \"$VERSION\" \"$NAME\" > $REMOTE_DIR/updates/version.yml"


# Ensure the remote software directory exists
echo "Ensuring remote software directory exists..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "mkdir -p $REMOTE_DIR/software"

# Zip and upload each folder in ./dist/electron/Packaged
echo "Zipping and uploading folders in ./dist/electron/Packaged..."
for FOLDER in ./dist/electron/Packaged/*; do
  if [ -d "$FOLDER" ]; then
    FOLDER_NAME=$(basename "$FOLDER")
    ZIP_FILE="./${FOLDER_NAME}.zip"

    echo "Zipping folder $FOLDER into $ZIP_FILE..."
    # (cd "${FOLDER}" && zip -r "${ZIP_FILE}" ${FOLDER}) 
    (cd "${FOLDER}" && zip -r "${ZIP_FILE}" *) || { echo "Failed to create zip file for $FOLDER"; exit 1; }

    OUTPUT_RELEASE_FOLDER="./dist/${NAME}_release"
    mkdir -p $OUTPUT_RELEASE_FOLDER
    mv $FOLDER/$ZIP_FILE $OUTPUT_RELEASE_FOLDER 


    echo "Uploading $ZIP_FILE to $REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/software/$FOLDER_NAME.zip..."
    scp -P "$REMOTE_PORT" "${OUTPUT_RELEASE_FOLDER}/${ZIP_FILE}" "$REMOTE_USER@$REMOTE_IP:$REMOTE_DIR/software/$FOLDER_NAME.zip"

    echo "Removing temporary zip file $ZIP_FILE..."
    rm -f "$ZIP_FILE"
  else
    echo "Skipping non-directory $FOLDER..."
  fi
done



# Change ownership of the uploaded files and directories
echo "Setting ownership of $REMOTE_DIR to www-data:www-data on the remote server..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "sudo chown -R beniben:www-data \"$REMOTE_DIR\""

# Create symbolic link pointing to the latest version
REMOTE_LATEST_LINK="$(dirname "$REMOTE_DIR")/latest"
echo "Creating symbolic link $REMOTE_LATEST_LINK pointing to $REMOTE_DIR..."
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_IP" "
  if [ -L \"$REMOTE_LATEST_LINK\" ] || [ -e \"$REMOTE_LATEST_LINK\" ]; then
    echo 'Removing existing latest link or directory...';
    rm -rf \"$REMOTE_LATEST_LINK\";
  fi
  ln -s \"$REMOTE_DIR\" \"$REMOTE_LATEST_LINK\";
  sudo chown -h www-data:www-data \"$REMOTE_LATEST_LINK\"; # Change ownership of the symlink
"

# Deployment completed
echo "Deployment completed successfully!"
