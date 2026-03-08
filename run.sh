start() {
	echo "Removing existing build directory"
	rm -rf build

	echo "Compiling..."
	tsc # Build the whole project
	echo "Copying static files..."
	rsync -a --exclude='*.ts' src/web/static build/web # Copy the static files into build

	echo -e "Running the Server: \n"
	node ./build/main.js & # Run web server
	return 0
}


startInWatchMode() {
	if start; then
		sleep 2 # NOTE: We sleep in between starts, so that the find command won't find the build-folder changes immediately
		while true; do
			if [ $(find . -mmin -0.016 | wc -l) -ne 0 ]; then
				echo "Files has been changed... Restarting:"
				kill -9 $(pgrep -f "node ./build/**")
				start
				sleep 2
			fi
		done
	fi
}

startInWatchMode
