#!/bin/bash

mkdir -p build/srv
mkdir -p build/files
echo "Bulding frontend..."
cd frontend
ng build
echo "Copying build files to build/..."
cp -R dist/frontend/browser/* ../build/srv
cd ..
echo "Copying backend files to build/..."
cp index.js build/index.js
cp run.sh build/run.sh
chmod +x build/run.sh
echo "Done! Run cgdl by running ./run.sh in build/."