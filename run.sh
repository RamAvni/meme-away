rm -rf build

tsc # Build the whole project
rsync -a --exclude='*.ts' src/web/static build/web # Copy the static files into build

node ./build/web/main.js # Run web server
