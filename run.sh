echo "Removing existing build directory"
rm -rf build

echo "Compiling..."
tsc # Build the whole project
echo "Copying static files..."
rsync -a --exclude='*.ts' src/web/static build/web # Copy the static files into build

echo "Running the Server:"
node ./build/main.js # Run web server
