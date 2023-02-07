#!/bin/bash

# This file gets used as entry point for the docker container. 
# You need to set the env var SERIAL_PORT if you want to use it manually.

cd $(dirname $0)

npm start